import { useEffect } from 'react';

export const ChatWidget = ({ user }: { user?: any }) => {
  useEffect(() => {
    // 1. Initialize Tawk timing
    (window as any).Tawk_LoadStart = new Date();

    // 2. Standard Tawk.to Script Injection
    (function(){
      var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6a76d8eac400c51d45dedcbe/1jvg3ulks';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode?.insertBefore(s1,s0);
      
      // 3. User Identity Handshake (ONLY if user is logged in)
      if (user) {
          (window as any).Tawk_API = (window as any).Tawk_API || {};
          (window as any).Tawk_API.onLoad = function(){
              (window as any).Tawk_API.setAttributes({
                  'name'  : user.username,
                  'email' : user.email
              }, () => {});
          };
      }
    })();
  }, [user]);

  return null;
};