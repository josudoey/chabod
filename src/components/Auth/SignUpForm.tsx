import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/tenant-utils";
import { AuthEmailInput } from "./AuthEmailInput";
import { AuthPasswordInput } from "./AuthPasswordInput";
import { TermsOfService } from "./TermsOfService";
import { useTranslation } from "react-i18next";

interface SignUpFormProps {
  tenantSlug?: string;
  tenantName?: string;
  inviteToken?: string;
  onSuccess?: () => void;
  onSignInClick: () => void;
}

export function SignUpForm({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
  onSignInClick,
}: SignUpFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignInOption, setShowSignInOption] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSignInOption(false);

    if (!termsAccepted) {
      toast({
        title: t("auth:pleaseAgreeToFaith"),
        description: t("auth:mustAgreeToRegister"),
        variant: "destructive",
      });
      return;
    }

    // Trim the full name before submitting
    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      toast({
        title: t("auth:nameCannotBeEmpty"),
        description: t("auth:pleaseEnterYourName"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
          },
        },
      });

      if (error) {
        // Check if it's a "user already registered" error
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          setError(t("auth:emailAlreadyRegistered"));
          setShowSignInOption(true);
          return;
        }

        // Translate other common Supabase error codes
        let errorMessage = t("auth:unknownError");
        if (error.message?.includes("invalid email")) {
          errorMessage = t("auth:emailFormatIncorrect");
        } else if (error.message?.includes("password")) {
          errorMessage = t("auth:passwordMinLength");
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // Associate new user with tenant if applicable
      if (tenantSlug && data.user) {
        try {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
        } catch (associateError) {
          // Sign out user if tenant association fails
          await supabase.auth.signOut();
          throw new Error(t("auth:cannotJoinChurch", { errorMessage: associateError }));
        }
      }

      toast({
        title: t("auth:accountCreatedSuccess"),
        description: tenantSlug
          ? t("auth:accountCreatedAndJoined", { tenantSlug })
          : t("auth:checkEmailForConfirmation"),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: t("auth:createAccountFailed"),
        description: error?.message || t("auth:unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t("auth:signUpTitle")}</CardTitle>
        <CardDescription>
          {tenantName ? t("auth:signUpToJoin", { tenantName }) : t("auth:signUpToChabod")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">{t("auth:fullName")}</Label>
            <Input
              id="full-name"
              placeholder={t("auth:enterYourName")}
              value={fullName}
              onChange={handleFullNameChange}
              required
            />
          </div>
          <AuthEmailInput value={email} onChange={setEmail} disabled={loading} />
          <AuthPasswordInput value={password} onChange={setPassword} required disabled={loading} />

          {error && (
            <div className="space-y-2">
              <div className="text-sm text-destructive">{error}</div>
              {showSignInOption && (
                <div className="text-sm text-muted-foreground">
                  {t("auth:alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={onSignInClick}
                    className="text-primary hover:underline"
                  >
                    {t("auth:signInToJoin")}
                  </button>
                </div>
              )}
            </div>
          )}

          <TermsOfService accepted={termsAccepted} onChange={setTermsAccepted} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth:creatingAccount") : t("auth:createAccount")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSignInClick}>
          {t("auth:alreadyHaveAccount")}
        </Button>
      </CardFooter>
    </Card>
  );
}
