import { Lock, Info } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

interface TabProps {
  label: string;
  value: string;
}

interface MultiTabSwitchProps {
  tabs: TabProps[];
  label: string;
  lgSize?: boolean;
  premium_feature?: string[];
  handleChange: (field: string, value: string) => void;
  field: string;
  userCredits: number;
}

const MultiTabSwitch: React.FC<MultiTabSwitchProps> = ({
  tabs,
  label,
  lgSize,
  premium_feature,
  handleChange,
  field,
  userCredits,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    tabs[0].value
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full flex flex-col items-start gap-2 relative">
      <div className="flex items-center ml-2 gap-1">
        <label
          className={`${
            lgSize ? "text-lg" : "text-base"
          } font-semibold text-gray-600 ${isDarkMode ? "text-white" : ""}`}
        >
          {label}
        </label>

        {field === "include_images" && (
          <div className="relative group">
            <Info style={{
              marginTop: "2.5px",
            }} size={16} className={`${isDarkMode ? "text-white" : "text-gray-500"} cursor-pointer`} />
            <div className="absolute invisible group-hover:visible bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#ECFDF4] text-[#4A5565] text-xs px-3 py-1 rounded-md shadow-md z-50 w-max">
              This is an Experimental Feature.
            </div>
          </div>
        )}
      </div>

      <div className="flex border-2 rounded-3xl border-green-100 relative">
        {tabs.map((option) => {
          const isPremium = premium_feature?.includes(option.value);
          const isDisabled = isPremium && userCredits === 0;

          return (
            <div key={option.value} className="relative group">
              <button
                className={`m-1 px-6 py-2 text-green-700 rounded-3xl cursor-pointer transition duration-300 ${
                  selectedOption === option.value
                    ? "bg-green-500 text-white"
                    : "bg-white text-black"
                } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={() => {
                  if (!isDisabled) {
                    setSelectedOption(option.value);
                    handleChange(field, option.value);
                  }
                }}
                disabled={isDisabled}
              >
                <div className="flex justify-center items-center gap-2">
                  <p>{option.label}</p>
                  {isPremium && userCredits === 0 && <Lock size={16} />}
                </div>
              </button>
              {isDisabled && (
                <div className="absolute invisible group-hover:visible bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#ECFDF4] text-[#4A5565] text-xs px-3 py-1 rounded-md shadow-md z-50 w-max">
                  You have 0 credits left.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiTabSwitch;
