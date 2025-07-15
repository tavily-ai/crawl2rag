import { useState } from "react";
import { LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";
import { SearchResult } from "../App";
import { convertDateFormat, getWebsiteName, truncateString, cleanMarkdownForPreview } from "../common/utils";

interface WebSearchProps {
  searchResults: SearchResult[];
  operationCount?: number;
}

const WebSearchResults: React.FC<WebSearchProps> = ({
  searchResults,
  operationCount: _operationCount,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  return (
    <div className="p-2 rounded-lg  w-full">
      <div
        className="flex items-center cursor-pointer space-x-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {!searchResults ? (
            <>
              <span className="font-semibold text-gray-700">
                Conducting web search
              </span>
            </>
          ) : (
            <span className="font-semibold text-gray-700">
              Web search complete
            </span>
          )}
        </div>
        {!searchResults ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-gray-500" />
        ) : isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </div>

      {isOpen && (
        <div className="mt-3 flex space-x-6">
          <div className="w-[60%] space-y-2">
            <ul className="space-y-2">
              {searchResults?.length
                ? (showAllResults
                    ? searchResults
                    : searchResults.slice(0, 5)
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
                        >
                          {actualIndex + 1}. {item.title}
                        </a>
                      </li>
                    );
                  })
                : "No search results"}
            </ul>

            {searchResults?.length > 5 && !showAllResults && (
              <button
                onClick={() => setShowAllResults(true)}
                className="mt-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
              >
                Show all {searchResults.length} results
              </button>
            )}

            {showAllResults && searchResults?.length > 5 && (
              <button
                onClick={() => setShowAllResults(false)}
                className="mt-3 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition"
              >
                Show less
              </button>
            )}
          </div>

          <div className="w-[40%]">
            {hoveredIndex !== null && searchResults && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg shadow">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{getWebsiteName(searchResults[hoveredIndex].url)}</span>
                  <span>
                    {convertDateFormat(
                      searchResults[hoveredIndex].published_date
                    )}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                  {searchResults[hoveredIndex].title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {truncateString(cleanMarkdownForPreview(searchResults[hoveredIndex].content))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSearchResults;
