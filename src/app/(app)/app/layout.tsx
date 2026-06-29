import { SuggestionFab } from "@/components/suggestion-fab";

// Telas logadas do app (não cobre /cadastro e /termo, que ficam no layout pai).
export default function AppLoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SuggestionFab />
    </>
  );
}
