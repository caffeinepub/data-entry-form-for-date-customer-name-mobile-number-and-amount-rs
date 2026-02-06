import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";


// Must have for all apps that store non-public data or personal data
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Entry management
  type Entry = {
    id : Text;
    manualDate : Text;
    customerName : Text;
    mobileNumber : Text;
    amountRs : Nat;
    createdAt : Time.Time;
    owner : ?Principal;
  };

  module Entry {
    public func compareByCreatedAtNewestFirst(entry1 : Entry, entry2 : Entry) : Order.Order {
      Int.compare(entry2.createdAt, entry1.createdAt);
    };
  };

  type EntryInput = {
    id : Text;
    manualDate : Text;
    customerName : Text;
    mobileNumber : Text;
    amountRs : Nat;
  };

  public type CreateEntryError = {
    #emptyField : {
      field : Text;
      message : Text;
    };
    #invalidAmount : {
      message : Text;
    };
  };

  public type UpdateEntryError = {
    #notFound : { message : Text };
    #unauthorized : { message : Text };
  } or CreateEntryError;

  public type DeleteEntryError = {
    #notFound : { message : Text };
    #unauthorized : { message : Text };
  };

  // Persisted storage
  var entriesStable : [(Text, Entry)] = [];
  let entries = Map.empty<Text, Entry>();

  system func preupgrade() {
    entriesStable := entries.toArray();
  };

  system func postupgrade() {
    entries.clear();
    for ((k, v) in entriesStable.values()) {
      entries.add(k, v);
    };
    entriesStable := [];
  };

  public shared ({ caller }) func createEntry(input : EntryInput) : async ?CreateEntryError {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create entries");
    };

    if (input.manualDate.trim(#char ' ') == "") {
      return ?#emptyField({
        field = "manualDate";
        message = "Manual date is required. Please enter a valid date.";
      });
    };

    if (input.customerName.trim(#char ' ') == "") {
      return ?#emptyField({
        field = "customerName";
        message = "Customer name is required. Please enter a valid name.";
      });
    };

    if (input.mobileNumber.trim(#char ' ') == "") {
      return ?#emptyField({
        field = "mobileNumber";
        message = "Mobile number is required. Please enter a valid mobile number.";
      });
    };

    if (input.amountRs == 0) {
      return ?#invalidAmount({
        message = "Amount must be greater than zero. Please enter a valid amount.";
      });
    };

    let newEntry : Entry = {
      input with
      createdAt = Time.now();
      owner = ?caller;
    };
    entries.add(newEntry.id, newEntry);
    null;
  };

  public shared ({ caller }) func updateEntry(id : Text, updatedFields : EntryInput) : async ?UpdateEntryError {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update entries");
    };

    switch (entries.get(id)) {
      case (null) {
        ?#notFound({ message = "Entry not found. Cannot update non-existent entry." });
      };
      case (?originalEntry) {
        // Check ownership: caller must be the owner or an admin
        if (originalEntry.owner != ?caller and not AccessControl.isAdmin(accessControlState, caller)) {
          return ?#unauthorized({ message = "Unauthorized: You can only update your own entries." });
        };

        if (updatedFields.manualDate.trim(#char ' ') == "") {
          return ?#emptyField({
            field = "manualDate";
            message = "Manual date is required. Please enter a valid date.";
          });
        };

        if (updatedFields.customerName.trim(#char ' ') == "") {
          return ?#emptyField({
            field = "customerName";
            message = "Customer name is required. Please enter a valid name.";
          });
        };

        if (updatedFields.mobileNumber.trim(#char ' ') == "") {
          return ?#emptyField({
            field = "mobileNumber";
            message = "Mobile number is required. Please enter a valid mobile number.";
          });
        };

        if (updatedFields.amountRs == 0) {
          return ?#invalidAmount({
            message = "Amount must be greater than zero. Please enter a valid amount.";
          });
        };

        let updatedEntry : Entry = {
          id = originalEntry.id;
          manualDate = updatedFields.manualDate;
          customerName = updatedFields.customerName;
          mobileNumber = updatedFields.mobileNumber;
          amountRs = updatedFields.amountRs;
          createdAt = originalEntry.createdAt;
          owner = originalEntry.owner;
        };

        entries.add(id, updatedEntry);
        null;
      };
    };
  };

  public shared ({ caller }) func deleteEntry(id : Text) : async ?DeleteEntryError {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete entries");
    };

    switch (entries.get(id)) {
      case (null) {
        ?#notFound({ message = "Entry not found. Cannot delete non-existent entry." });
      };
      case (?entry) {
        // Check ownership: caller must be the owner or an admin
        if (entry.owner != ?caller and not AccessControl.isAdmin(accessControlState, caller)) {
          return ?#unauthorized({ message = "Unauthorized: You can only delete your own entries." });
        };

        entries.remove(id);
        null;
      };
    };
  };

  public query ({ caller }) func listEntriesNewestFirst() : async [Entry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list entries");
    };

    entries.values().toList<Entry>().toArray().sort<Entry>(Entry.compareByCreatedAtNewestFirst);
  };
};
