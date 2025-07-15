import { useState } from "react";
import { LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ExtractResult } from "../App";
import { getWebsiteName, truncateString, extractTitleFromUrl, cleanMarkdownForPreview } from "../common/utils";

interface ExtractResultsProps {
  extractResults: ExtractResult[];
  operationCount?: number;
}

const ExtractResults: React.FC<ExtractResultsProps> = ({
  extractResults,
  operationCount: _operationCount,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  return (
    <div className="p-2 rounded-lg w-full">
      <div
        className="flex items-center cursor-pointer space-x-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {!extractResults ? (
            <>
              <span className="font-semibold text-gray-700">
                Conducting content extraction
              </span>
            </>
          ) : (
            <span className="font-semibold text-gray-700">
              Content extraction complete
            </span>
          )}
        </div>
        {!extractResults ? (
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
              {extractResults?.length
                ? (showAllResults
                    ? extractResults
                    : extractResults.slice(0, 5)
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
                          {actualIndex + 1}. {item.url}
                        </a>
                      </li>
                    );
                  })
                : "No extraction results"}
            </ul>

            {extractResults?.length > 5 && !showAllResults && (
              <button
                onClick={() => setShowAllResults(true)}
                className="mt-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
              >
                Show all {extractResults.length} results
              </button>
            )}

            {showAllResults && extractResults?.length > 5 && (
              <button
                onClick={() => setShowAllResults(false)}
                className="mt-3 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition"
              >
                Show less
              </button>
            )}
          </div>

          <div className="w-[40%]">
            {hoveredIndex !== null && extractResults && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg shadow">
                <div className="text-xs text-gray-500">
                  <span>
                    {getWebsiteName(extractResults[hoveredIndex].url)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                  {extractTitleFromUrl(extractResults[hoveredIndex].url)}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {truncateString(
                    cleanMarkdownForPreview(
                      extractResults[hoveredIndex].raw_content
                    )
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

export default ExtractResults;
