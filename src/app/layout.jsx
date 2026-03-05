import './globals.css';

export const metadata = {
  title: 'MKBarbearia - Agende seu Horário',
  description: 'Estilo, precisão e atitude. Agende seu horário na MKBarbearia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
