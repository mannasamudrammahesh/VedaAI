import React from 'react';
import '../styles/global.css';
import StyledJsxRegistry from './registry';

const svgIcon = "data:image/svg+xml;utf8,%3Csvg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23F59223' /%3E%3Cstop offset='100%25' stop-color='%237E1515' /%3E%3C/linearGradient%3E%3ClinearGradient id='leftArmGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='40%25' stop-color='%23FFFFFF' /%3E%3Cstop offset='100%25' stop-color='%23C2C2C2' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='28' fill='url(%23bgGrad)'/%3E%3Cpath d='M 22 34 L 42 34 L 54 74 L 34 74 Z' fill='url(%23leftArmGrad)' stroke='url(%23leftArmGrad)' stroke-width='2' stroke-linejoin='round' /%3E%3Cpath d='M 58 34 L 78 34 L 66 74 L 46 74 Z' fill='%23FFFFFF' stroke='%23FFFFFF' stroke-width='2' stroke-linejoin='round' /%3E%3C/svg%3E";

export const metadata = {
  title: 'VedaAI - Dynamic Assessment Creator',
  description: 'Generate high-fidelity structured question papers and answer keys using advanced educational AI.',
  icons: {
    icon: svgIcon,
    apple: svgIcon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledJsxRegistry>
          {children}
        </StyledJsxRegistry>
      </body>
    </html>
  );
}

