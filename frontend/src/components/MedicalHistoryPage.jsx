import { useState, useEffect } from "react";
import { Activity, Shield, ChevronRight } from "lucide-react";
import { historyAPI } from '../services/api';

// Convert your Python dicts into JS objects
const CHRONIC_DISEASES = {
  Hypertension: ["headache", "chest_pain", "dizziness", "loss_of_balance", "lack_of_concentration"],
  Migraine: [
    "acidity", "indigestion", "headache", "blurred_and_distorted_vision",
    "excessive_hunger", "stiff_neck", "depression", "irritability", "visual_disturbances"
  ],
  Cervical_spondylosis: ["back_pain", "weakness_in_limbs", "neck_pain", "dizziness", "loss_of_balance"],
  Diabetes: [
    "fatigue", "weight_loss", "restlessness", "lethargy", "irregular_sugar_level",
    "blurred_and_distorted_vision", "obesity", "excessive_hunger", "increased_appetite", "polyuria"
  ],
  Arthritis: [
    "muscle_weakness",
    "stiff_neck",
    "swelling_joints",
    "movement_stiffness",
    "spinning_movements",
    "loss_of_balance",
    "unsteadiness",
    "weakness_of_one_body_side"
  ],
  Chronic_cholestasis: [
    "itching",
    "vomiting",
    "yellowish_skin",
    "nausea",
    "loss_of_appetite",
    "abdominal_pain",
    "yellowing_of_eyes"
  ],

  Heart_attack: [
    "vomiting",
    "breathlessness",
    "sweating",
    "chest_pain"
  ],

  Bronchial_Asthma: [
    "fatigue",
    "cough",
    "high_fever",
    "breathlessness",
    "family_history",
    "mucoid_sputum"
  ],

  GERD: [
    "stomach_pain",
    "acidity",
    "ulcers_on_tongue",
    "vomiting",
    "cough",
    "chest_pain"
  ],

  Peptic_ulcer_disease: [
    "vomiting",
    "loss_of_appetite",
    "abdominal_pain",
    "passage_of_gases",
    "internal_itching"
  ],

  Osteoarthristis: [
    "joint_pain",
    "neck_pain",
    "knee_pain",
    "hip_joint_pain",
    "swelling_joints",
    "painful_walking"
  ],

  Hypothyroidism: [
    "fatigue",
    "weight_gain",
    "cold_hands_and_feets",
    "mood_swings",
    "lethargy",
    "dizziness",
    "puffy_face_and_eyes",
    "enlarged_thyroid",
    "brittle_nails",
    "swollen_extremeties",
    "depression",
    "irritability",
    "abnormal_menstruation"
  ],

  Hyperthyroidism: [
    "fatigue",
    "mood_swings",
    "weight_loss",
    "restlessness",
    "sweating",
    "diarrhoea",
    "fast_heart_rate",
    "excessive_hunger",
    "muscle_weakness",
    "irritability",
    "abnormal_menstruation"
  ],

  Hypoglycemia: [
    "vomiting",
    "fatigue",
    "anxiety",
    "sweating",
    "headache",
    "nausea",
    "blurred_and_distorted_vision",
    "excessive_hunger",
    "drying_and_tingling_lips",
    "slurred_speech",
    "irritability",
    "palpitations"
  ],

  Psoriasis: [
    "skin_rash",
    "joint_pain",
    "skin_peeling",
    "silver_like_dusting",
    "small_dents_in_nails",
    "inflammatory_nails"
  ],

  Varicose_veins: [
    "fatigue",
    "cramps",
    "bruising",
    "obesity",
    "swollen_legs",
    "swollen_blood_vessels",
    "prominent_veins_on_calf"
  ],

  Paralysis_brain_hemorrhage: [
    "vomiting",
    "headache",
    "weakness_of_one_body_side",
    "altered_sensorium"
  ]


};

const GENETIC_DISEASES = {
  Hemochromatosis: ["joint_pain", "vomiting", "fatigue", "high_fever", "loss_of_appetite", "abdominal_pain"],
  Thalassemia: [
    "fatigue", "weight_loss", "breathlessness", "yellowish_skin", "dark_urine",
    "loss_of_appetite", "abdominal_pain"
  ],
  Sickle_cell_anemia: [
    "joint_pain", "vomiting", "fatigue", "high_fever", "breathlessness", "swelling_joints"
  ],
  Polycystic_kidney_disease: [
    "vomiting",
    "fatigue",
    "high_fever",
    "nausea",
    "loss_of_appetite",
    "abdominal_pain",
    "back_pain",
    "headache",
    "blood_in_urine"
  ],

  Cystic_fibrosis: [
    "fatigue",
    "cough",
    "high_fever",
    "breathlessness",
    "mucoid_sputum",
    "rusty_sputum",
    "salty_taste_in_mouth",
    "weight_loss",
    "family_history"
  ],

  Duchenne_muscular_dystrophy: [
    "muscle_weakness",
    "fatigue",
    "weakness_in_limbs",
    "movement_stiffness",
    "loss_of_balance",
    "unsteadiness",
    "delayed_milestones",
    "difficulty_walking"
  ],

  Down_syndrome: [
    "delayed_milestones",
    "developmental_delays",
    "weak_muscle_tone",
    "short_stature",
    "flat_facial_features",
    "upward_slanting_eyes"
  ],

  Huntingtons_disease: [
    "movement_stiffness",
    "spinning_movements",
    "unsteadiness",
    "weakness_of_one_body_side",
    "altered_sensorium",
    "mood_swings",
    "depression",
    "irritability",
    "slurred_speech"
  ],

  Marfan_syndrome: [
    "joint_pain",
    "weakness_in_limbs",
    "chest_pain",
    "breathlessness",
    "blurred_and_distorted_vision",
    "tall_stature",
    "long_fingers",
    "heart_problems"
  ],

  Phenylketonuria: [
    "developmental_delays",
    "intellectual_disability",
    "seizures",
    "skin_rash",
    "musty_odor",
    "behavioral_problems"
  ],

  Hemophilia: [
    "joint_pain",
    "bruising",
    "continuous_bleeding",
    "blood_in_urine",
    "prolonged_bleeding",
    "swelling_joints",
    "internal_bleeding"
  ],

  Turners_syndrome: [
    "short_stature",
    "delayed_puberty",
    "webbed_neck",
    "swelling_extremeties",
    "heart_problems",
    "kidney_problems"
  ],

  Klinefelters_syndrome: [
    "tall_stature",
    "weak_muscle_tone",
    "delayed_puberty",
    "enlarged_breast_tissue",
    "reduced_facial_hair",
    "infertility"
  ]

};

export function MedicalHistoryPage({ onSkip, onSubmit }) {
  const [formData, setFormData] = useState({
    chronicDiseases: [],
    geneticDiseases: [],
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      setLoading(true);
      setApiError('');
      try {
        const result = await historyAPI.get();
        if (!mounted) return;
        if (!result.success) {
          setApiError(result.error || 'Failed to load medical history');
          setLoading(false);
          return;
        }

        const history = result.data.history;
        if (!history) {
          setLoading(false);
          return;
        }

        const parseList = (val) => {
          if (!val) return [];
          // Try JSON first
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            // ignore
          }
          // Fallback: comma separated string
          return String(val)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        };

        setFormData((prev) => ({
          ...prev,
          chronicDiseases: parseList(history.chronic_diseases),
          geneticDiseases: parseList(history.genetic_diseases),
        }));
      } catch (err) {
        console.error('Load medical history error:', err);
        setApiError('Failed to load medical history');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleDisease = (category, diseaseName) => {
    setFormData((prev) => {
      const key = category === 'chronic' ? 'chronicDiseases' : 'geneticDiseases';
      const currentlySelected = prev[key] || [];

      const updated = currentlySelected.includes(diseaseName)
        ? currentlySelected.filter((d) => d !== diseaseName)
        : [...currentlySelected, diseaseName];

      return { ...prev, [key]: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isSelected = (category, disease) => {
    const key = category === 'chronic' ? 'chronicDiseases' : 'geneticDiseases';
    return (formData[key] || []).includes(disease);
  };

  const diseaseCardClasses = (category, disease) =>
    `p-4 border rounded-lg cursor-pointer transition-all ${isSelected(category, disease)
      ? 'bg-green-50 border-green-500 shadow-md'
      : 'bg-white border-gray-300 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-white to-[#ECFDF5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <Activity className="w-12 h-12 text-[#0EA5E9] mb-4 mx-auto" />
            <h2 className="text-gray-900 mb-3">Medical History</h2>

            <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 text-left">
                This helps us understand your health better. Optional, can be added later.
              </p>
            </div>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {loading && (
              <div className="mb-2 text-sm text-gray-600">Loading your saved medical history...</div>
            )}

            {/* CHRONIC DISEASES */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Chronic Diseases
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(CHRONIC_DISEASES).map((disease) => (
                  <div
                    key={disease}
                    onClick={() => toggleDisease('chronic', disease)}
                    className={diseaseCardClasses('chronic', disease)}
                  >
                    {/* Hidden checkbox to track selection but not shown */}
                    <input
                      type="checkbox"
                      checked={isSelected('chronic', disease)}
                      onChange={() => toggleDisease('chronic', disease)}
                      className="hidden"
                    />
                    <div key={disease} className="text-gray-600">
                      <p className="font-medium">
                        {disease.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GENETIC DISEASES */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Genetic Diseases
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(GENETIC_DISEASES).map((disease) => (
                  <div
                    key={disease}
                    onClick={() => toggleDisease('genetic', disease)}
                    className={diseaseCardClasses('genetic', disease)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected('genetic', disease)}
                      onChange={() => toggleDisease('genetic', disease)}
                      className="hidden"
                    />
                    <div key={disease} className="text-gray-600">
                      <p className="font-medium">
                        {disease.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Skip for Now
              </button>

              <button
                type="submit"
                className="flex-1 py-3 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors shadow-md"
              >
                Save and Continue
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}