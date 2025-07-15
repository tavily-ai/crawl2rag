import { useState } from "react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { VectorResult } from "../App";
import { getWebsiteName, truncateString, extractTitleFromUrl, cleanMarkdownForPreview } from "../common/utils";

interface VectorSearchProps {
  vectorResults: VectorResult[];
  operationCount?: number;
}

const VectorSearch: React.FC<VectorSearchProps> = ({
  vectorResults,
  operationCount: _operationCount,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  // Get all results from all vector searches
  const allResults = vectorResults.flatMap(vr => vr.results || []);
  const hasResults = allResults.length > 0;

  // Don't render anything if there are no results
  if (!hasResults) {
    return null;
  }

  return (
    <div className="p-2 rounded-lg w-full">
      <div
        className="flex items-center cursor-pointer space-x-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700">
            Vector search complete
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </div>

      {isOpen && (
        <div className="mt-3 flex space-x-6">
          <div className="w-[60%] space-y-2">
            <ul className="space-y-2">
              {allResults?.length
                ? (showAllResults
                    ? allResults
                    : allResults.slice(0, 5)
                  ).map((item, index) => {
                    const actualIndex = showAllResults ? index : index;
                    return (
                      <li
                        key={index}
                        className="cursor-pointer text-gray-700 hover:text-blue-500 transition 
                       whitespace-nowrap overflow-hidden text-ellipsis"
                        onMouseEnter={() => setHoveredIndex(actualIndex)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <span className="w-8 text-right flex-shrink-0">{actualIndex + 1}.</span>
                          <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                            {item.favicon ? (
                              <img
                                src={item.favicon}
                                alt=""
                                className="w-4 h-4 object-cover"
                                onError={(e) => {
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
                                  }
                                }}
                              />
                            ) : (
                              <Globe className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <span className="truncate">{item.title || extractTitleFromUrl(item.url)}</span>                        </a>
                      </li>
                    );
                  })
                : "No vector search results"}
            </ul>

            {allResults?.length > 5 && !showAllResults && (
              <button
                onClick={() => setShowAllResults(true)}
                className="mt-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
              >
                Show all {allResults.length} results
              </button>
            )}

            {showAllResults && allResults?.length > 5 && (
              <button
                onClick={() => setShowAllResults(false)}
                className="mt-3 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition"
              >
                Show less
              </button>
            )}
          </div>

          <div className="w-[40%]">
            {hoveredIndex !== null && allResults && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg shadow">
                <div className="text-xs text-gray-500">
                  <span>
                    {getWebsiteName(allResults[hoveredIndex].url)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                  {extractTitleFromUrl(allResults[hoveredIndex].url)}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {truncateString(
                    cleanMarkdownForPreview(allResults[hoveredIndex].content)
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorSearch; 