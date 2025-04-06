import { useState } from 'react';
import { Bell, Search, User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <header className="h-16 border-b border-diamond-lightGray bg-white flex items-center px-4 sticky top-0 z-10 shadow-sm">
      <div className="flex-1 flex items-center">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-diamond-mediumGray" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-diamond-lightGray focus:border-diamond-gold focus:ring-diamond-gold/20"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" className="text-diamond-mediumGray border-diamond-lightGray hover:bg-diamond-gold/10 hover:text-diamond-black">
          <HelpCircle size={18} />
        </Button>
        
        <Button variant="outline" size="icon" className="text-diamond-mediumGray border-diamond-lightGray hover:bg-diamond-gold/10 hover:text-diamond-black">
          <Bell size={18} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-diamond-lightGray hover:bg-diamond-gold/10 hover:text-diamond-black">
              <User size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-diamond-lightGray">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">Admin User</span>
                <span className="text-xs text-diamond-mediumGray">admin@diamondai.tech</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link to="/settings">
              <DropdownMenuItem className="cursor-pointer hover:bg-diamond-gold/10 hover:text-diamond-black">
                <User className="mr-2 h-4 w-4" />
                <span>My Account</span>
              </DropdownMenuItem>
            </Link>
            <Link to="/settings">
              <DropdownMenuItem className="cursor-pointer hover:bg-diamond-gold/10 hover:text-diamond-black">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
