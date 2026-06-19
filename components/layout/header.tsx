import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

export function Header({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b bg-background px-8 py-5">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <Badge variant="outline" className="gap-1">
          Mock veri modu
        </Badge>
        <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" />
        <UserButton />
      </div>
    </div>
  );
}
