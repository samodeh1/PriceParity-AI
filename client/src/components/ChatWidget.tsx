import { useEffect } from 'react';

export const ChatWidget = ({ user }: { user: any }) => {
  useEffect(() => {
    // Only load the chat if a user is logged in
    if (!user) return;

    const Tawk_API: any = (window as any).Tawk_API || {};
    // @ts-ignore
    const Tawk_LoadStart = new Date();

    (function(){
      var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      // YOUR REAL TAWK.TO URL:
      s1.src = 'https://embed.tawk.to/6a76d8eac400c51d45dedcbe/1jvg3ulks';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode?.insertBefore(s1,s0);
      
      // Pass the user's name and email to your Tawk.to dashboard
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.onLoad = function(){
          (window as any).Tawk_API.setAttributes({
              'name'  : user.username,
              'email' : user.email
          }, function(error: any){});
      };
    })();
  }, [user]);

  return null;
};