import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { render } from "@testing-library/react";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import type { ChatMessageUI } from "@/hooks/useChatAssistant";
import type { DataAppSession } from "@/services/workflows/types";
import type { ChatPanelProps } from "@/components/chat/ChatPanel";

// The wrapper's job is to wire the workflow/session hooks to the presentational
// ChatPanel (whose UI behavior is covered by base's ChatPanel test). Capture the
// props it forwards and assert the hook data + resolved display strings.
let captured: ChatPanelProps;
vi.mock("@/components/chat/ChatPanel", () => ({
  ChatPanel: (props: ChatPanelProps) => {
    captured = props;
    return <div data-testid="chat-panel" />;
  },
}));

const mockSendMessage = vi.fn();
const mockLoadSession = vi.fn();
const mockStartNewChat = vi.fn();
const mockInvalidateQueries = vi.fn();

let hookReturn: {
  messages: ChatMessageUI[];
  sendMessage: Mock;
  isLoading: boolean;
  error: Error | null;
  sessions: DataAppSession[];
  loadSession: Mock;
  startNewChat: Mock;
  ready: boolean;
};

let configData: unknown;

vi.mock("@/hooks/useChatAssistant", () => ({
  useChatAssistant: () => hookReturn,
}));

vi.mock("@/hooks/useDataAppSessions", () => ({
  useWorkflowDataAppConfig: () => ({ data: configData }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

function makeConfig(properties: Record<string, unknown>) {
  return {
    data: {
      attributes: { configuration: { interface: { properties } } },
    },
  };
}

describe("ChatAssistant (wrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configData = undefined;
    hookReturn = {
      messages: [],
      sendMessage: mockSendMessage,
      isLoading: false,
      error: null,
      sessions: [],
      loadSession: mockLoadSession,
      startNewChat: mockStartNewChat,
      ready: true,
    };
  });

  it("forwards hook data and handlers to ChatPanel", () => {
    hookReturn.messages = [{ id: "u-1", role: "user", content: "hi" }];
    hookReturn.isLoading = true;
    hookReturn.ready = true;
    render(<ChatAssistant workflowId="wf-1" />);

    expect(captured.messages).toBe(hookReturn.messages);
    expect(captured.isLoading).toBe(true);
    expect(captured.ready).toBe(true);
    expect(captured.onSend).toBe(mockSendMessage);
    expect(captured.onLoadSession).toBe(mockLoadSession);
    expect(captured.onNewChat).toBe(mockStartNewChat);
  });

  it("resolves title: explicit name > config card_title > default", () => {
    render(<ChatAssistant workflowId="wf-1" name="Explicit" />);
    expect(captured.title).toBe("Explicit");

    configData = makeConfig({ card_title: "From Config" });
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.title).toBe("From Config");

    configData = undefined;
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.title).toBe("Assistant");
  });

  it("resolves welcome message: emptyMessage prop > config > default", () => {
    render(<ChatAssistant workflowId="wf-1" emptyMessage="Custom welcome" />);
    expect(captured.welcomeMessage).toBe("Custom welcome");

    configData = makeConfig({
      chat_bot: { welcome_message: "Config welcome" },
    });
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.welcomeMessage).toBe("Config welcome");

    configData = undefined;
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.welcomeMessage).toBe("Ask anything to get started.");
  });

  it("passes the notReadyMessage default and override", () => {
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.notReadyMessage).toBe(
      "Publish this workflow from the platform to enable chat.",
    );

    render(<ChatAssistant workflowId="wf-1" notReadyMessage="Not yet" />);
    expect(captured.notReadyMessage).toBe("Not yet");
  });

  it("forwards the chatbot avatar from config", () => {
    configData = makeConfig({ chat_bot: { avatar: { value: "avatar.png" } } });
    render(<ChatAssistant workflowId="wf-1" />);
    expect(captured.chatbotAvatar).toBe("avatar.png");
  });

  it("onHistoryOpen invalidates the sessions query", () => {
    render(<ChatAssistant workflowId="wf-1" />);
    captured.onHistoryOpen?.();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["dataAppSessions"],
      exact: false,
    });
  });
});
