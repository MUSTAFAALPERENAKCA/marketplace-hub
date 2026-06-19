import { OrganizationList } from "@clerk/nextjs";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Mağazanı oluştur</h1>
        <p className="text-muted-foreground">
          Panele devam etmek için bir satıcı hesabı (organizasyon) oluştur veya
          davet edildiğin bir hesabı seç.
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />
    </div>
  );
}
