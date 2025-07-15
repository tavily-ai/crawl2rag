import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface ChartStartProps {
  onSubmit: (input: string) => void;
  apiKey: string | undefined;
  setApiKey: React.Dispatch<React.SetStateAction<string | undefined>>;
  showApiKeyDropdwown: boolean;
  setShowApiKeyDropdwown: React.Dispatch<React.SetStateAction<boolean>>;
  onCreateKnowledgeBase: (url: string) => void;
}

const ChatStart: React.FC<ChartStartProps> = ({
  onSubmit: _onSubmit,
  apiKey,
  setApiKey,
  setShowApiKeyDropdwown,
  onCreateKnowledgeBase,
}) => {
  const [showKey, setShowKey] = useState<boolean>(false);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] = useState(false);
  const [error, setError] = useState<string>("");

  const checkApiKey = () => {
    return apiKey?.includes("tvly-") && apiKey?.length >= 32;
  };

  const handleCreateKnowledgeBase = async () => {
    if (!checkApiKey()) {
      setShowApiKeyDropdwown(true);
      setError("API key is required");
      return;
    }
    
    if (!crawlUrl) {
      setError("Please enter a website URL");
      return;
    }

    setIsCreatingKnowledgeBase(true);
    setError("");
    
    try {
      await onCreateKnowledgeBase(crawlUrl);
      setCrawlUrl("");
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      setError("Failed to create knowledge base. Please try again.");
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Main Content */}
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Turn Any Website into a Searchable Knowledge Base

          </h1>
          <p className="text-gray-600">
          with Tavily Crawl
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <input
              type="url"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              placeholder="Website URL"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#468BFF] focus:border-[#468BFF] outline-none transition"
            />
          </div>

          {/* API Key Input */}
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey || ""}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Tavily API Key"
              className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#468BFF] focus:border-[#468BFF] outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center text-sm text-[#FE363B] bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleCreateKnowledgeBase}
            disabled={!crawlUrl || !checkApiKey() || isCreatingKnowledgeBase}
            className={`w-full py-4 rounded-lg font-medium transition ${
              !crawlUrl || !checkApiKey() || isCreatingKnowledgeBase
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#468BFF] text-white hover:bg-[#3A7BF0]"
            }`}
          >
            {isCreatingKnowledgeBase ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Building Vector Database...
              </div>
            ) : (
              "Create Knowledge Base"
            )}
          </button>
        </div>

        {/* API Key Link */}
        <div className="text-center">
          <a
            href="https://app.tavily.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-[#468BFF] transition"
          >
            Get your API key →
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatStart;
