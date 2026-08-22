import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-medium"
      onClick={() => i18n.changeLanguage(isEn ? "bn" : "en")}
    >
      {isEn ? "বাং" : "EN"}
    </Button>
  );
}
