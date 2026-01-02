import React from "react";
import { 
  Briefcase, 
  CheckCircle, 
  GraduationCap, 
  Award, 
  Mail, 
  Share2, 
  Star, 
  MapPin, 
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  Clock,
  ExternalLink
} from "lucide-react";

export default function Page() {
  // Mock freelancer data based on requirements
  const freelancer = {
    name: "Alex Rivera",
    title: "Senior Full Stack Developer & Blockchain Architect",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&h=250&auto=format&fit=crop",
    category: "Software Development",
    description: "I am a passionate Full Stack Developer with over 8 years of experience building scalable web applications and decentralized solutions. My expertise lies in React, Node.js, and Solidity. I help startups turn their ideas into reality with high-quality code and robust architecture. I'm dedicated to delivering clean, maintainable, and efficient solutions that provide real value to users.",
    totalJobs: 142,
    successfulJobs: 138,
    rating: 4.9,
    location: "San Francisco, CA",
    hourlyRate: "$85/hr",
    joinedDate: "January 2021",
    reviews: [
      {
        id: 1,
        author: "Sarah Johnson",
        company: "TechFlow Inc.",
        text: "Alex is an exceptional developer. He delivered our DeFi platform ahead of schedule and the code quality was top-notch. Highly recommended!",
        rating: 5,
        date: "2 weeks ago"
      },
      {
        id: 2,
        author: "Michael Chen",
        company: "StartupLab",
        text: "Great communication and very deep technical knowledge. Alex helped us solve a critical performance bottleneck in our React app.",
        rating: 5,
        date: "1 month ago"
      }
    ],
    education: [
      {
        school: "Stanford University",
        degree: "B.S. in Computer Science",
        year: "2012 - 2016"
      }
    ],
    qualifications: [
      "Advanced React Patterns & Performance",
      "Smart Contract Security Auditing",
      "Cloud Infrastructure Management (AWS/GCP)",
      "System Architecture Design"
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        year: "2023"
      },
      {
        name: "Professional Scrum Master I",
        issuer: "Scrum.org",
        year: "2022"
      }
    ],
    contacts: {
      email: "alex.rivera@example.com",
      website: "https://alexrivera.dev",
      github: "arivera",
      linkedin: "alex-rivera-dev",
      twitter: "arivera_dev"
    }
  };

  const successRate = Math.round((freelancer.successfulJobs / freelancer.totalJobs) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8">
            <div className="relative flex flex-col sm:flex-row items-end -mt-16 sm:space-x-6">
              <img
                src={freelancer.profilePicture}
                alt={freelancer.name}
                className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-800 shadow-md object-cover bg-white dark:bg-slate-800"
              />
              <div className="flex-1 mt-6 sm:mt-0 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{freelancer.name}</h1>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium text-lg">{freelancer.title}</p>
                  </div>
                  <div className="flex space-x-3 mt-4 sm:mt-0">
                    <button className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </button>
                    <button className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                <span>{freelancer.location}</span>
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Briefcase className="w-5 h-5 mr-3 text-slate-400" />
                <span>{freelancer.category}</span>
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Clock className="w-5 h-5 mr-3 text-slate-400" />
                <span>Joined {freelancer.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats and Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Work Statistics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Job Success</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{successRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Jobs</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{freelancer.totalJobs}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Rating</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mr-1">{freelancer.rating}</p>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center mb-6">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Certifications</h3>
              </div>
              <div className="space-y-4">
                {freelancer.certifications.map((cert, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mt-1 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
                      <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{cert.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{cert.issuer} • {cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social / Contacts */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Connect</h3>
              <div className="space-y-3">
                <a href={`mailto:${freelancer.contacts.email}`} className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
                  <Mail className="w-5 h-5 mr-3 text-slate-400" />
                  <span className="text-sm truncate">{freelancer.contacts.email}</span>
                </a>
                <a href={freelancer.contacts.website} className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
                  <LinkIcon className="w-5 h-5 mr-3 text-slate-400" />
                  <span className="text-sm">Personal Website</span>
                </a>
                <div className="flex justify-between px-2 pt-2">
                  <a href={`https://github.com/${freelancer.contacts.github}`} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-400">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={`https://linkedin.com/in/${freelancer.contacts.linkedin}`} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-400">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href={`https://twitter.com/${freelancer.contacts.twitter}`} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-400">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About Me</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {freelancer.description}
              </p>
            </div>

            {/* Education & Qualifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center mb-6">
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Education</h3>
                </div>
                <div className="space-y-6">
                  {freelancer.education.map((edu, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600"></div>
                      <p className="font-bold text-slate-900 dark:text-white">{edu.school}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">{edu.degree}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center mb-6">
                  <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Qualifications</h3>
                </div>
                <ul className="space-y-3">
                  {freelancer.qualifications.map((qual, index) => (
                    <li key={index} className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mr-3"></div>
                      {qual}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Client Reviews</h3>
                <div className="flex items-center bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                  <span className="text-amber-700 dark:text-amber-400 font-bold text-sm">{freelancer.rating}</span>
                </div>
              </div>
              <div className="space-y-8">
                {freelancer.reviews.map((review) => (
                  <div key={review.id} className="pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{review.author}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{review.company}</p>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{review.date}</span>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed">
                      "{review.text}"
                    </p>
                  </div>
                ))}
                <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center">
                  View All Reviews
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}