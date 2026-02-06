import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Entry {
    id: string;
    customerName: string;
    owner?: Principal;
    createdAt: Time;
    mobileNumber: string;
    amountRs: bigint;
    manualDate: string;
}
export type Time = bigint;
export interface EntryInput {
    id: string;
    customerName: string;
    mobileNumber: string;
    amountRs: bigint;
    manualDate: string;
}
export type UpdateEntryError = {
    __kind__: "emptyField";
    emptyField: {
        field: string;
        message: string;
    };
} | {
    __kind__: "notFound";
    notFound: {
        message: string;
    };
} | {
    __kind__: "unauthorized";
    unauthorized: {
        message: string;
    };
} | {
    __kind__: "invalidAmount";
    invalidAmount: {
        message: string;
    };
};
export type DeleteEntryError = {
    __kind__: "notFound";
    notFound: {
        message: string;
    };
} | {
    __kind__: "unauthorized";
    unauthorized: {
        message: string;
    };
};
export type CreateEntryError = {
    __kind__: "emptyField";
    emptyField: {
        field: string;
        message: string;
    };
} | {
    __kind__: "invalidAmount";
    invalidAmount: {
        message: string;
    };
};
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEntry(input: EntryInput): Promise<CreateEntryError | null>;
    deleteEntry(id: string): Promise<DeleteEntryError | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listEntriesNewestFirst(): Promise<Array<Entry>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEntry(id: string, updatedFields: EntryInput): Promise<UpdateEntryError | null>;
}
