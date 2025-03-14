import { Lock } from "lucide-react";
import React, { useState } from "react";

interface TabProps {
  label: string;
  value: string;
}

interface MultiTabSwitchProps {
  tabs: TabProps[];
  label: string;
  lgSize?: boolean;
  premium_feature?: string[];
}

const MultiTabSwitch: React.FC<MultiTabSwitchProps> = ({
  tabs,
  label,
  lgSize,
  premium_feature,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    tabs[0].value
  );

  return (
    <div className="w-full flex flex-col items-start gap-2">
      <label
        className={`${
          lgSize ? "text-lg" : "text-base"
        } font-semibold text-gray-600 ml-2`}
      >
        {label}
      </label>
      <div className="flex border-2 rounded-3xl border-green-100">
        {tabs.map((option) => (
          <button
            key={option.value}
            className={`m-1 px-6 py-2 bg-white text-green-700 rounded-3xl transition duration-300 ${
              selectedOption === option.value
                ? "bg-green-500 text-white"
                : "bg-white text-black"
            }`}
            onClick={() => setSelectedOption(option.value)}
          >
            <div className="flex justify-center items-center gap-2">
              <p>{option.label}</p>
              {premium_feature?.includes(option.value) && <Lock size={16}/>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MultiTabSwitch;
