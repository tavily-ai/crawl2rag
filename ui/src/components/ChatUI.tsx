import React, { useState, useRef, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import {
  CheckCircle2,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import WebSearch from "./WebSearch";
import ExtractResults from "./ExtractResults";
import CrawlResults from "./CrawlResults";
import VectorSearch from "./VectorSearch";
import StreamingComponent from "./StreamingComponent";
import { Message } from "../App";
import { ConversationType } from "../common/enums";

interface ChatUIProps {
  onSubmit: (input: string) => void;
  messages: Message[];
  recapMessage: string;
}

// Removed unused markdown helper function

const ChatUI: React.FC<ChatUIProps> = ({
  onSubmit,
  messages,
  recapMessage,
}) => {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [expandedQueries, setExpandedQueries] = useState<{
    [key: number]: boolean;
  }>({});
  // Removed unused state variables for extracts and crawls

  console.log("ChatUI render - received messages:", messages);
  console.log("ChatUI render - recapMessage:", recapMessage);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message when no messages yet
  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col items-center justify-around min-h-screen">
      <div className="w-full max-w-3xl rounded-lg flex flex-col h-[90vh] relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                  Knowledge Base Ready!
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl">
                  You can now ask questions related to the crawled content.
                </p>
              </div>
              
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                <button
                  onClick={() => onSubmit("What information is available in this knowledge base?")}
                  className="p-4 border border-[#468BFF] bg-white text-[#468BFF] rounded-lg hover:bg-[#468BFF] hover:text-white transition"
                >
                  What's in this knowledge base?
                </button>
                <button
                  onClick={() => onSubmit("Summarize the main topics covered")}
                  className="p-4 border border-[#468BFF] bg-white text-[#468BFF] rounded-lg hover:bg-[#468BFF] hover:text-white transition"
                >
                  Summarize main topics
                </button>
              </div> */}
            </div>
          ) : (
            messages.map((message, index) => {
              console.log(`ChatUI - rendering message ${index}:`, message);
              console.log(
                `ChatUI - message ${index} response:`,
                message.response
              );

              return (
                <div key={index} className="space-y-2">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="p-3 rounded-lg max-w-xs bg-[#468BFF] text-white self-end">
                      {message.userMessage}
                    </div>
                  </div>

                  {message.response && (
                    <>
                      {message.response.type === ConversationType.TAVILY && (
                        <>
                          <div className="flex items-center justify-start gap-2">
                            <img
                              src="/tavilylogo.png"
                              alt="Tavily Logo"
                              className="h-8 w-auto object-contain"
                            />
                            <div className="text-sm text-gray-500">
                              {(() => {
                                const toolType =
                                  message.response.toolType || "search";
                                const toolOps = message.response.toolOperations;

                                if (message.response.isSearching) {
                                  if (toolOps) {
                                    if (toolType === "search") {
                                      return "is searching";
                                    } else if (toolType === "extract") {
                                      return "is extracting";
                                    } else if (toolType === "crawl") {
                                      return "is crawling";
                                    } else if (toolType === "vector") {
                                      return "is searching the vector database";
                                    }
                                  }
                                  return toolType === "search"
                                    ? "is searching"
                                    : toolType === "extract"
                                      ? "is extracting"
                                      : toolType === "crawl"
                                        ? "is crawling"
                                        : toolType === "vector"
                                          ? "is searching the vector database"
                                          : "is working";
                                } else {
                                  if (toolOps) {
                                    if (toolType === "search") {
                                      return "searched";
                                    } else if (toolType === "extract") {
                                      return "extracted";
                                    } else if (toolType === "crawl") {
                                      return "crawled";
                                    } else if (toolType === "vector") {
                                      return "vector search";
                                    }
                                  }
                                  return toolType === "search"
                                    ? "searched"
                                    : toolType === "extract"
                                      ? "extracted"
                                      : toolType === "crawl"
                                        ? "crawled"
                                        : toolType === "vector"
                                          ? "searched the vector database"
                                          : "completed";
                                }
                              })()}
                            </div>
                            <div>
                              {message.response.isSearching ? (
                                <LoaderCircle className="h-6 w-6 animate-spin text-blue-500" />
                              ) : (
                                <CheckCircle2 className="h-6 w-6 text-blue-500" />
                              )}
                            </div>
                          </div>

                          {/* Query Details - show if multiple queries were performed */}
                          {message.response.toolOperations?.search.totalQueries &&
                            message.response.toolOperations.search.totalQueries
                              .length > 1 && (
                              <div className="flex items-center justify-start mt-2">
                                <div className="p-2 rounded-lg w-full">
                                  <div
                                    className="flex items-center cursor-pointer space-x-2"
                                    onClick={() =>
                                      setExpandedQueries((prev) => ({
                                        ...prev,
                                        [index]: !prev[index],
                                      }))
                                    }
                                  >
                                    <span className="text-sm text-gray-600 font-medium">
                                      View search queries (
                                      {
                                        message.response.toolOperations.search
                                          .totalQueries.length
                                      }
                                      )
                                    </span>
                                    {expandedQueries[index] ? (
                                      <ChevronUp className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>

                                  {expandedQueries[index] && (
                                    <div className="mt-2 bg-gray-50 rounded-lg p-3">
                                      <div className="text-xs font-medium text-gray-600 mb-2">
                                        Search queries performed:
                                      </div>
                                      <ul className="space-y-1">
                                        {message.response.toolOperations.search.totalQueries.map(
                                          (query, queryIndex) => (
                                            <li
                                              key={queryIndex}
                                              className="text-sm text-gray-700"
                                            >
                                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                                {queryIndex + 1}. "{query}"
                                              </span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Search Results */}
                          {message.response.searchResults &&
                            (() => {
                              console.log(
                                `ChatUI - rendering WebSearch for message ${index}`
                              );
                              return (
                                <div className="flex items-center justify-start mt-0">
                                  <WebSearch
                                    searchResults={message.response.searchResults}
                                    operationCount={
                                      message.response.toolOperations?.search
                                        .completed
                                    }
                                  />
                                </div>
                              );
                            })()}

                          {/* Extract Results */}
                          {message.response.extractResults && (
                            <div className="flex items-center justify-start mt-0">
                              <ExtractResults
                                extractResults={message.response.extractResults}
                                operationCount={
                                  message.response.toolOperations?.extract
                                    .completed
                                }
                              />
                            </div>
                          )}

                          {/* Crawl Results */}
                          {message.response.crawlResults && (
                            <div className="flex items-center justify-start mt-0">
                              <CrawlResults
                                crawlResults={message.response.crawlResults}
                                operationCount={
                                  message.response.toolOperations?.crawl.completed
                                }
                                crawlBaseUrl={message.response.crawlBaseUrl}
                              />
                            </div>
                          )}

                          {/* Vector Search Results */}
                          {message.response.toolType === "vector" && (
                            <div className="flex items-center justify-start mt-0">
                              <VectorSearch
                                vectorResults={message.response.vectorResults || []}
                                operationCount={
                                  message.response.toolOperations?.vector.completed
                                }
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-start mt-0">
                        <StreamingComponent
                          recapMessage={
                            message.response.recapMessage
                              ? message.response.recapMessage
                              : recapMessage
                                ? recapMessage
                                : ""
                          }
                          isSearching={message.response.isSearching}
                          error={message.response.error}
                        />
                      </div>
                    </>
                  )}

                  <div ref={chatEndRef} />
                </div>
              );
            })
          )}
        </div>

        <div className=" flex items-center w-full ">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={showWelcome ? "Ask me anything about your knowledge base..." : "Follow up"}
              className="w-full p-3 pr-12 border border-blue-300 rounded-lg focus:ring focus:ring-blue-300 outline-none resize-none overflow-auto"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "200px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                if (target.scrollHeight <= 200) {
                  target.style.height = target.scrollHeight + "px";
                } else {
                  target.style.height = "200px";
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(input);
                  setInput("");
                }
              }}
            />
            <button
              onClick={() => {
                onSubmit(input);
                setInput("");
              }}
              className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
