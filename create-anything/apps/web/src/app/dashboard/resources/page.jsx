"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ExternalLink, BookOpen } from "lucide-react";

const STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const CATEGORIES = [
  "Legal Aid",
  "CPS/Agency",
  "Court",
  "Parenting Classes",
  "Mental Health",
  "Substance Support",
  "Housing",
  "Domestic Violence",
  "Hotline",
  "Other",
];

export default function ResourcesPage() {
  const [selectedState, setSelectedState] = useState("Michigan");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["resources", selectedState, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedState) params.append("state", selectedState);
      if (selectedCategory) params.append("category", selectedCategory);
      return fetch(`/api/resources?${params}`).then((res) => res.json());
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-3xl font-serif font-medium text-gray-900 mb-2">
          Resource Hub
        </h1>
        <p className="text-gray-500 mb-6">
          Find local support, legal aid, and services in your state.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white appearance-none"
              >
                <option value="">All States</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white appearance-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? (
          <p className="text-gray-500 col-span-2 text-center py-8">
            Loading resources...
          </p>
        ) : resources && resources.length > 0 ? (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded-md mb-2 inline-block">
                  {resource.category}
                </span>
                {resource.state && (
                  <span className="text-xs text-gray-500">
                    {resource.state}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {resource.name}
              </h3>
              {resource.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
                >
                  Visit Website <ExternalLink size={14} className="ml-1" />
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No resources found for this selection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
