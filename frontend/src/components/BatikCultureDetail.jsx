import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Palette, Lightbulb, Sparkles } from 'lucide-react';
import { getBatikDetail } from '../data/batikDetails';
import BilingualText from './BilingualText';

/**
 * BatikCultureDetail Component
 * Menampilkan detail budaya dan sejarah motif batik dengan UI premium
 * dengan card elegant, gradient emas, dan animasi fade-in
 */
const BatikCultureDetail = ({ batikName }) => {
  const [expandedSection, setExpandedSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [batikName]);

  const detail = getBatikDetail(batikName);

  if (!detail) {
    return null;
  }

  // Define sections dengan icon dan warna
  const sections = [
    {
      id: 0,
      title: "Sejarah Batik",
      titleEn: "Batik History",
      content: detail.history,
      contentEn: detail.history_en,
      icon: BookOpen,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700"
    },
    {
      id: 1,
      title: "Corak Identik",
      titleEn: "Signature Pattern",
      content: detail.motif,
      contentEn: detail.motif_en,
      icon: Palette,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-700"
    },
    {
      id: 2,
      title: "Filosofi Motif",
      titleEn: "Motif Philosophy",
      content: detail.philosophy,
      contentEn: detail.philosophy_en,
      icon: Lightbulb,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-50 to-blue-50",
      borderColor: "border-cyan-200",
      badgeBg: "bg-cyan-100",
      badgeText: "text-cyan-700"
    },
    {
      id: 3,
      title: "Biasanya Dipakai",
      titleEn: "Common Usage",
      content: detail.usage,
      contentEn: detail.usage_en,
      icon: Sparkles,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700"
    }
  ];

  return (
    <div className={`w-full max-w-none -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-block mb-4">
          <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-sm font-semibold text-amber-800">
            ✨ Warisan Budaya Sumatra Selatan
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          {batikName}
        </h2>
        <p className="text-slate-600">
          Jelajahi sejarah, makna, dan signifikansi budaya motif batik tradisional
        </p>
      </div>

      {/* Meta Information */}
      {(detail.period || detail.region) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {detail.period && (
            <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-4 sm:p-5">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                Periode Berkembang
              </p>
              <p className="mt-2 text-base sm:text-lg font-bold text-slate-900">{detail.period}</p>
            </div>
          )}
          {detail.region && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 p-4 sm:p-5">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                Asal-Usul Daerah
              </p>
              <p className="mt-2 text-base sm:text-lg font-bold text-slate-900">{detail.region}</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border-2 ${section.borderColor} overflow-hidden transition-all duration-300 transform hover:scale-[1.01] ${
                isExpanded ? `bg-gradient-to-br ${section.bgGradient} shadow-lg` : 'bg-white shadow-md'
              }`}
            >
              {/* Header Button */}
              <button
                onClick={() => setExpandedSection(isExpanded ? -1 : section.id)}
                className={`w-full px-5 sm:px-6 py-5 sm:py-6 flex items-center justify-between gap-4 transition-all duration-300 ${
                  isExpanded ? `bg-gradient-to-r ${section.gradient} text-white` : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 text-left">
                  <div
                    className={`p-2.5 rounded-lg ${
                      isExpanded ? 'bg-white/20' : `bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`
                    }`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isExpanded ? 'text-white' : ''}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base sm:text-lg ${isExpanded ? 'text-white' : 'text-slate-900'}`}>
                      {section.title}
                    </h3>
                    {!isExpanded && (
                      <p className={`text-xs sm:text-sm mt-1 line-clamp-1 ${isExpanded ? 'text-white/80' : 'text-slate-600'}`}>
                        {section.content.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                </div>
                <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                  isExpanded ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className={`px-5 sm:px-6 py-5 sm:py-6 border-t-2 ${section.borderColor} bg-white/60 backdrop-blur-sm animate-slideDown`}>
                  <div className="prose prose-sm max-w-none space-y-4">
                    <p className="text-slate-800 leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line">
                      {section.content}
                    </p>
                    {section.contentEn && (
                      <p className="text-slate-500 leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line">
                        {section.contentEn}
                      </p>
                    )}
                  </div>
                  
                  {/* Visual Divider */}
                  <div className="mt-5 pt-5 border-t border-slate-200/50 flex items-center gap-2">
                    <div className={`inline-block px-3 py-1.5 rounded-full ${section.badgeBg} ${section.badgeText} text-xs font-semibold`}>
                      {['Sejarah', 'Desain', 'Nilai', 'Kegunaan'][section.id]}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white w-full max-w-none">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex gap-3 sm:gap-4">
            <span className="text-2xl">🎨</span>
            <div>
              <p className="font-bold text-base sm:text-lg mb-2">Warisan Budaya Abadi</p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Batik {batikName} merupakan bagian penting dari kekayaan warisan budaya Sumatra Selatan yang terus dilestarikan dan dikembangkan oleh masyarakat lokal dan pengrajin tradisional.
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-300/80 leading-relaxed">
                Batik {batikName} is an important part of South Sumatra's cultural heritage, continually preserved and developed by local communities and traditional artisans.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BatikCultureDetail;
