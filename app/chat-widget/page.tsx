import { Suspense } from "react";
import { ChatWidget } from "./chat-widget";

export default function ChatWidgetPage() {
  return (
    <Suspense>
      <ChatWidget />
    </Suspense>
  );
}
