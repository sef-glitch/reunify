import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import useUser from "@/utils/useUser";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

export default function IntakePage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [errors, setErrors] = useState({});
  const { data: user, loading: userLoading } = useUser();

  const createCase = useMutation({
    mutationFn: async (data) => {
      console.log("=== INTAKE SUBMIT ===");
      console.log("Sending request to /api/cases");
      console.log("Payload:", JSON.stringify(data, null, 2));

      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      let result;
      try {
        result = await response.json();
        console.log("Response body:", result);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error(
          `Server returned status ${response.status} but invalid JSON`,
        );
      }

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    },
    onSuccess: (data) => {
      console.log("=== INTAKE SUCCESS ===");
      console.log("Case created:", data);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success(
        `Case plan created successfully with ${data.plan_items_count || 0} tasks!`,
      );
      // Redirect to the plan page (FIXED: was /dashboard/weekly-plan)
      setTimeout(() => {
        window.location.href = "/dashboard/plan";
      }, 1000);
    },
    onError: (error) => {
      console.error("=== INTAKE ERROR ===");
      console.error("Case creation error:", error);
      console.error("Error message:", error.message);
      setLoading(false);

      // If unauthorized, redirect to login
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          window.location.href =
            "/account/signin?callbackUrl=/dashboard/intake";
        }, 1000);
      } else {
        // Show the actual error message from the server
        toast.error(
          error.message || "Failed to create case. Please try again.",
        );
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to create a case plan");
      setTimeout(() => {
        window.location.href = "/account/signin?callbackUrl=/dashboard/intake";
      }, 1000);
      return;
    }

    const formData = new FormData(e.target);

    // Validate required fields
    const title = formData.get("title")?.trim();
    const state = formData.get("state");
    const stage = formData.get("stage");

    const newErrors = {};
    if (!title) {
      newErrors.title = "Case title is required";
    }
    if (!state) {
      newErrors.state = "State is required";
    }
    if (!stage) {
      newErrors.stage = "Current stage is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const risks = [];

    // Map checkboxes to risks array
    if (formData.get("housing")) risks.push("Housing");
    if (formData.get("employment")) risks.push("Employment");
    if (formData.get("sobriety")) risks.push("Substance"); // Mapped to match DB template key
    if (formData.get("safety")) risks.push("DV/Safety");
    if (formData.get("mental_health")) risks.push("Mental Health");
    if (formData.get("transportation")) risks.push("Transportation");
    if (formData.get("missed_visits")) risks.push("Missed Visits");
    if (formData.get("missed_services")) risks.push("Missed Services");

    const courtDate = formData.get("next_court_date");

    const data = {
      title,
      state,
      case_type: stage,
      next_hearing_date: courtDate || null,
      notes: formData.get("notes") || "",
    };

    console.log("Submitting case data:", data);
    console.log("User authenticated:", user?.email);

    try {
      await createCase.mutateAsync(data);
    } catch (error) {
      console.error("Caught error in handleSubmit:", error);
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // If not authenticated, show message and redirect
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">
          Please Log In
        </h2>
        <p className="text-gray-600 mb-6">
          You need to be logged in to create a case plan.
        </p>
        <a
          href="/account/signin?callbackUrl=/dashboard/intake"
          className="inline-block bg-[#121212] text-white font-semibold px-6 py-3 rounded-xl hover:bg-black transition-colors"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900 mb-2">
          Case Intake
        </h1>
        <p className="text-gray-500">
          Create a new case plan by filling out the details below. This
          generates your weekly checklist.
        </p>
      </div>

      {/* How It Works Section */}
      {showHowItWorks && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6 mb-8 relative">
          <button
            onClick={() => setShowHowItWorks(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                How It Works
              </h3>
              <p className="text-sm text-gray-600">
                Reunify helps you stay organized and on track with your case
                plan.
              </p>
            </div>
          </div>

          <div className="space-y-4 ml-13">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Fill out this form</p>
                <p className="text-sm text-gray-600">
                  Tell us where you are in your case (stage) and what the court
                  or CPS has asked you to work on (risks and requirements).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Get your weekly action plan
                </p>
                <p className="text-sm text-gray-600">
                  We'll create a personalized checklist of tasks to complete
                  each week, based on your specific situation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Check off tasks and upload proof
                </p>
                <p className="text-sm text-gray-600">
                  Mark tasks complete as you finish them. Upload proof (photos,
                  documents, receipts) to your secure vault.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Share with your lawyer or caseworker
                </p>
                <p className="text-sm text-gray-600">
                  Export a professional PDF packet showing everything you've
                  completed. Bring it to court or meetings.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200">
            <p className="text-xs text-gray-500 italic">
              💡 Tip: You can update your plan anytime. If your situation
              changes or you get new requirements, just come back and update
              your case.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Section 1: Case Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
              Case Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Smith Family Reunification"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.title ? "border-red-400 bg-red-50" : "border-gray-200"} focus:ring-2 focus:ring-[#8B70F6] focus:outline-none`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  name="state"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.state ? "border-red-400 bg-red-50" : "border-gray-200"} focus:ring-2 focus:ring-[#8B70F6] focus:outline-none bg-white`}
                >
                  <option value="">Select state...</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stage *
                </label>
                <select
                  name="stage"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.stage ? "border-red-400 bg-red-50" : "border-gray-200"} focus:ring-2 focus:ring-[#8B70F6] focus:outline-none bg-white`}
                >
                  <option value="">Select stage...</option>
                  <option value="Pre-Trial">Pre-Trial</option>
                  <option value="Adjudication">Adjudication</option>
                  <option value="Disposition">Disposition</option>
                  <option value="Review">Review Hearing</option>
                  <option value="Permanency">Permanency Planning</option>
                  <option value="Termination">Termination (TPR)</option>
                </select>
                {errors.stage && (
                  <p className="mt-1 text-sm text-red-600">{errors.stage}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Court Date (Optional)
              </label>
              <input
                type="date"
                name="next_court_date"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8B70F6] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Identified Risks */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
              Identified Risks & Requirements
            </h3>
            <p className="text-sm text-gray-500">
              Select all areas that are currently part of your case plan or
              court orders.
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="housing"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Housing
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="employment"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Employment
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="sobriety"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Sobriety / Testing
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="safety"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  DV / Safety
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="mental_health"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mental Health
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="transportation"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Transportation
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="missed_visits"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Missed Visits
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="missed_services"
                  className="w-5 h-5 text-[#8B70F6] rounded focus:ring-[#8B70F6]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Missed Services
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
              Additional Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for your lawyer or case worker
              </label>
              <textarea
                name="notes"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8B70F6] focus:outline-none"
                placeholder="Enter any specific details, case number, or questions here..."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#121212] text-white font-semibold py-4 rounded-xl hover:bg-black transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Plan...
                </>
              ) : (
                "Create My Action Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
