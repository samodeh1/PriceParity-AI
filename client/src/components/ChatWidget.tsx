import { useEffect } from 'react';

export const ChatWidget = ({ user }: { user: any }) => {
  useEffect(() => {
    if (!user) return;

    // Use window directly to avoid "unused variable" errors
    (window as any).Tawk_LoadStart = new Date();

    (function(){
      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6a76d8eac400c51d45dedcbe/1jvg3ulks';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode?.insertBefore(s1,s0);
      
      // We removed the variable declaration and used direct window access
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.onLoad = function(){
          (window as any).Tawk_API.setAttributes({
              'name'  : user.username,
              'email' : user.email
          }, () => {}); // Fixed: removed unused 'error' parameter
      };
    })();
  }, [user]);

  return null;
};