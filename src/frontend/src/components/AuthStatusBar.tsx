import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { LogIn, LogOut, User } from 'lucide-react';

/**
 * AuthStatusBar component displays authentication status and provides sign in/out actions
 */
export function AuthStatusBar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${isAuthenticated ? 'bg-primary/10' : 'bg-muted'}`}>
              <User className={`h-5 w-5 ${isAuthenticated ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isAuthenticated ? 'Signed in' : 'Not signed in'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAuthenticated 
                  ? 'You can create and view entries' 
                  : 'Sign in to create and view entries'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
          >
            {isLoggingIn ? (
              'Signing in...'
            ) : isAuthenticated ? (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Sign in
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
