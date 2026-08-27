import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, LogOut, Settings, ChevronDown, Building2, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export const ProfileDropdown = () => {
  const { user, signOut: candidateSignOut } = useAuth();
  const { companyUser, signOut: companySignOut, isAuthenticated: isCompanyAuth } = useCompanyAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleCandidateSignOut = async () => {
    await candidateSignOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleCompanySignOut = () => {
    companySignOut();
    toast({
      title: "Signed out",
      description: "You have been signed out from the Employer Portal.",
    });
    navigate("/company/auth?mode=signin");
  };

  const handleMyAccount = () => {
    setOpen(false);
    navigate("/account");
  };

  const handleCompanyDashboard = () => {
    setOpen(false);
    navigate("/company/dashboard");
  };

  // If company is authenticated, render company dropdown
  if (isCompanyAuth && companyUser) {
    const displayName =
      companyUser.profile?.companyName ||
      companyUser.profile?.firstName ||
      companyUser.email.split("@")[0] ||
      "Partner Employer";
    const email = companyUser.email;

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>
              <span className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-1">
                Employer Account
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCompanyDashboard} className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4 text-primary" />
            Company Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/partnership" className="cursor-pointer flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Partnership Info
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCompanySignOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If candidate is authenticated
  if (user) {
    const displayName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";
    const email = user.email || "";

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleMyAccount} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            My Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCandidateSignOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
};
