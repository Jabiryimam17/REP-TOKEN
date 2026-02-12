"use client";

import React, {useEffect, useState} from "react";
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Trophy, 
  Wallet, 
  Shield, 
  ArrowUpRight, 
  ExternalLink, 
  MessageSquare, 
  Instagram,
  Send,
  Star,
  Settings,
  Bell,
  Search,
  ChevronRight,
  MoreVertical,
  Plus,
  Coins,
  Cpu,
  Flame,
  LayoutDashboard,
  TrendingUp,
  User,
  FileText,
  MapPin,
  GraduationCap,
  Award,
  Phone,
  Image as ImageIcon,
  Trash2,
  Mail,
  Github,
  Linkedin,
  Twitter
} from "lucide-react";
import axios from "axios";

export default function FreelancerDashboard() {
  const [active_view, set_active_view] = useState("overview"); // overview or profile
  const [activeTab, setActiveTab] = useState("workingOn");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile_data, set_profile_data] = useState({
    f_name: "",
    l_name: "",
    title: "",
    bio: "",
    profile_picture: "",
    category: "",
    description: "",
    location: "",
    skills: [],
    education: [],
    qualifications: [],
    certifications: [],
    contacts: {
      website: "",
      github: "",
      linkedin: "",
      twitter: "",
      instagram: "",
      telegram: "",
      whatsapp: ""
    }
  });

  const [freelancer_data, set_freelancer_data] = useState({
    balances: {
      rpTokens: 0,
      stableCoin: 0,
      currency: "USDC"
    },
    stats: {
      totalJobs: 0,
      successfulJobs: 0,
      successRate: "0%",
      totalEarned: "0"
    },
    publicAddresses: {
      ethereum: "",
      bitcoin: "",
      solana: ""
    },
    jobs: {
      workingOn: [],
      bidOn: [],
      inDispute: [],
      paymentWaiting: [],
      finished: [],
      requested: []
    }
  });

  const get_profile_picture_url = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:3333${path}`;
  };

  useEffect(() => {
    const fetch_data = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`http://localhost:3333/api/freelancers/dashboard`, {
          withCredentials: true
        });
        
        const data = response.data;
        if (data) {
          set_profile_data({
            f_name: data.profile.f_name || "",
            l_name: data.profile.l_name || "",
            title: data.profile.title || "",
            bio: data.profile.bio || "",
            profile_picture: get_profile_picture_url(data.profile.profile_picture) || "",
            category: data.profile.category || "Software Development",
            description: data.profile.description || "",
            location: data.profile.location || "",
            skills: data.profile.skills ? (typeof data.profile.skills === 'string' ? JSON.parse(data.profile.skills) : data.profile.skills) : [],
            education: data.education.map(edu => ({
              school: edu.school,
              degree: edu.degree,
              startYear: edu.startYear,
              endYear: edu.endYear
            })),
            qualifications: (data.profile.qualifications || []).map(q => ({
              title: q.title,
              issuer: q.issuer,
              year: q.year
            })),
            certifications: (data.certifications || []).map(cert => ({
              name: cert.title,
              issuer: cert.issuer,
              year: cert.year
            })),
            contacts: {
              email: data.profile.email || "",
              website: (data.contacts && data.contacts.website) || "",
              github: (data.contacts && data.contacts.github) || "",
              linkedin: (data.contacts && data.contacts.linkedin) || "",
              twitter: (data.contacts && data.contacts.twitter) || "",
              instagram: (data.contacts && data.contacts.instagram) || "",
              telegram: (data.contacts && data.contacts.telegram) || "",
              whatsapp: (data.contacts && data.contacts.whatsapp) || ""
            }
          });

          // Process jobs into categories
          const jobsByStatus = {
            workingOn: (data.jobs || []).filter(j => j.status === 'active').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            })),
            bidOn: (data.jobs || []).filter(j => j.status === 'pending').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            })),
            inDispute: (data.jobs || []).filter(j => j.status === 'disputed').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            })),
            paymentWaiting: (data.jobs || []).filter(j => j.status === 'completed_waiting_payment').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            })),
            finished: (data.jobs || []).filter(j => j.status === 'completed').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            })),
            requested: (data.jobs || []).filter(j => j.status === 'invited').map(j => ({
              id: j.id,
              title: j.title,
              employer: `${j.employer_f_name} ${j.employer_l_name}`,
              amount: j.budget,
              description: j.description,
              note: j.note,
              link: `/jobs/${j.id}`
            }))
          };

          set_freelancer_data(prev => ({
            ...prev,
            jobs: jobsByStatus,
            // Mocking stats and balances for now as they might come from other services or fields
            balances: {
              rpTokens: 12500, // Still mock for now
              stableCoin: data.profile.min_wage * 10 || 0, // Just a placeholder
              currency: "USDC"
            }
          }));
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please make sure you are logged in.");
        setLoading(false);
      }
    };

    fetch_data();
  }, []);

  const freelancer = {
    name: `${profile_data.f_name} ${profile_data.l_name}`,
    publicAddresses: freelancer_data.publicAddresses,
    balances: freelancer_data.balances,
    stats: freelancer_data.stats,
    jobs: freelancer_data.jobs
  };


  const jobTabs = [
    { id: "workingOn", label: "Working On", icon: Cpu, count: freelancer.jobs.workingOn.length },
    { id: "bidOn", label: "Bid On", icon: Hourglass, count: freelancer.jobs.bidOn.length },
    { id: "inDispute", label: "In Dispute", icon: AlertCircle, count: freelancer.jobs.inDispute.length, color: "text-red-500" },
    { id: "paymentWaiting", label: "Waiting Payment", icon: Wallet, count: freelancer.jobs.paymentWaiting.length },
    { id: "finished", label: "Finished", icon: CheckCircle2, count: freelancer.jobs.finished.length },
    { id: "requested", label: "Requested", icon: Plus, count: freelancer.jobs.requested.length, color: "text-indigo-600" },
  ];

  const handleProfileChange = (field, value) => {
    set_profile_data(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field, value) => {
    set_profile_data(prev => ({
      ...prev,
      contacts: { ...prev.contacts, [field]: value }
    }));
  };

  const addItem = (field, initialValue) => {
    set_profile_data(prev => ({
      ...prev,
      [field]: [...prev[field], initialValue]
    }));
  };

  const removeItem = (field, index) => {
    set_profile_data(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (field, index, value) => {
    set_profile_data(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        user: {
          f_name: profile_data.f_name,
          l_name: profile_data.l_name,
          title: profile_data.title,
          category: profile_data.category,
          description: profile_data.description,
          bio: profile_data.bio,
          location: profile_data.location,
          skills: profile_data.skills,
          qualifications: profile_data.qualifications.map(q => ({
            title: q.title,
            issuer: q.issuer,
            year: q.year
          })),
          certifications: profile_data.certifications.map(c => ({
            title: c.name,
            issuer: c.issuer,
            year: c.year
          })),
          education_levels: profile_data.education.map(e => ({
            institution: e.school,
            title: e.degree,
            start_year: e.startYear,
            end_year: e.endYear
          })),
          profile_picture: profile_data.profile_picture,
          contacts: {
            github: profile_data.contacts.github,
            website: profile_data.contacts.website,
            twitter: profile_data.contacts.twitter,
            linkedin: profile_data.contacts.linkedin,
            instagram: profile_data.contacts.instagram,
            telegram: profile_data.contacts.telegram,
            whatsapp: profile_data.contacts.whatsapp
          }
        }
      };

      await axios.put(`http://localhost:3333/api/freelancers/update`, updateData, {
        withCredentials: true
      });

      window.location.reload();
      setLoading(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <User className="w-5 h-5 mr-2 text-indigo-600" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
            <input 
              type="text" 
              value={profile_data.f_name}
              onChange={(e) => handleProfileChange("f_name", e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
            <input 
              type="text" 
              value={profile_data.l_name}
              onChange={(e) => handleProfileChange("l_name", e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Professional Title</label>
            <input 
              type="text" 
              value={profile_data.title}
              onChange={(e) => handleProfileChange("title", e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
            <textarea 
              value={profile_data.bio}
              onChange={(e) => handleProfileChange("bio", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <select 
              value={profile_data.category}
              onChange={(e) => handleProfileChange("category", e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option>Software Development</option>
              <option>Design</option>
              <option>Marketing</option>
              <option>Writing</option>
              <option>Blockchain</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={profile_data.location}
                onChange={(e) => handleProfileChange("location", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Profile Picture URL</label>
            <div className="flex gap-4 items-center">
              <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                {profile_data.profile_picture ? (
                  <img src={profile_data.profile_picture} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-200">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <input 
                type="text" 
                value={profile_data.profile_picture}
                onChange={(e) => handleProfileChange("profile_picture", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          Detailed Description
        </h3>
        <textarea 
          value={profile_data.description}
          onChange={(e) => handleProfileChange("description", e.target.value)}
          rows={5}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
          placeholder="Detailed description of your services and experience..."
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-indigo-600" />
            Skills
          </h3>
          <div className="flex gap-2">
            <input 
              type="text"
              id="skill-input"
              placeholder="Add a skill (e.g. React)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.target.value.trim();
                  if (val && !profile_data.skills.includes(val)) {
                    handleProfileChange("skills", [...profile_data.skills, val]);
                    e.target.value = "";
                  }
                }
              }}
              className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
            />
            <button 
              onClick={() => {
                const input = document.getElementById('skill-input');
                const val = input.value.trim();
                if (val && !profile_data.skills.includes(val)) {
                  handleProfileChange("skills", [...profile_data.skills, val]);
                  input.value = "";
                }
              }}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile_data.skills.map((skill, index) => (
            <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold border border-indigo-100 dark:border-indigo-800 group">
              {skill}
              <button 
                onClick={() => handleProfileChange("skills", profile_data.skills.filter((_, i) => i !== index))}
                className="text-indigo-300 hover:text-red-500 transition-colors"
              >                <Trash2 className="w-4 h-4" />
              </button>
            </span>
          ))}
          {profile_data.skills.length === 0 && (
            <p className="text-slate-400 text-sm italic">No skills added yet. Type a skill and press Enter or click (+).</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Education Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
              Education
            </h3>
            <button 
              onClick={() => addItem("education", { school: "", degree: "", startYear: "", endYear: "" })}
              className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {profile_data.education.map((edu, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl relative group">
                <button 
                  onClick={() => removeItem("education", index)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <input 
                  placeholder="School/University"
                  value={edu.school}
                  onChange={(e) => updateItem("education", index, { ...edu, school: e.target.value })}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white mb-1 outline-none"
                />
                <input 
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateItem("education", index, { ...edu, degree: e.target.value })}
                  className="w-full bg-transparent text-sm text-indigo-600 dark:text-indigo-400 mb-1 outline-none"
                />
                <div className="flex gap-2">
                  <input 
                    placeholder="Start Year"
                    value={edu.startYear}
                    onChange={(e) => updateItem("education", index, { ...edu, startYear: e.target.value })}
                    className="w-full bg-transparent text-xs text-slate-500 outline-none"
                  />
                  <span className="text-xs text-slate-400">-</span>
                  <input 
                    placeholder="End Year (or Present)"
                    value={edu.endYear}
                    onChange={(e) => updateItem("education", index, { ...edu, endYear: e.target.value })}
                    className="w-full bg-transparent text-xs text-slate-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-indigo-600" />
              Certifications
            </h3>
            <button 
              onClick={() => addItem("certifications", { name: "", issuer: "", year: "" })}
              className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {profile_data.certifications.map((cert, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl relative group">
                <button 
                  onClick={() => removeItem("certifications", index)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <input 
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => updateItem("certifications", index, { ...cert, name: e.target.value })}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white mb-1 outline-none"
                />
                <input 
                  placeholder="Issuer"
                  value={cert.issuer}
                  onChange={(e) => updateItem("certifications", index, { ...cert, issuer: e.target.value })}
                  className="w-full bg-transparent text-sm text-indigo-600 dark:text-indigo-400 mb-1 outline-none"
                />
                <input 
                  placeholder="Year"
                  value={cert.year}
                  onChange={(e) => updateItem("certifications", index, { ...cert, year: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Qualifications Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
              Qualifications
            </h3>
            <button 
              onClick={() => addItem("qualifications", { title: "", issuer: "", year: "" })}
              className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {profile_data.qualifications.map((qual, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl relative group">
                <button 
                  onClick={() => removeItem("qualifications", index)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <input 
                  placeholder="Qualification Title"
                  value={qual.title}
                  onChange={(e) => updateItem("qualifications", index, { ...qual, title: e.target.value })}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white mb-1 outline-none"
                />
                <input 
                  placeholder="Issuer"
                  value={qual.issuer}
                  onChange={(e) => updateItem("qualifications", index, { ...qual, issuer: e.target.value })}
                  className="w-full bg-transparent text-sm text-indigo-600 dark:text-indigo-400 mb-1 outline-none"
                />
                <input 
                  placeholder="Year"
                  value={qual.year}
                  onChange={(e) => updateItem("qualifications", index, { ...qual, year: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-indigo-600" />
            Contact & Social
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <input 
                placeholder="Website"
                value={profile_data.contacts.website}
                onChange={(e) => handleContactChange("website", e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Github className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="GitHub"
                  value={profile_data.contacts.github}
                  onChange={(e) => handleContactChange("github", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Linkedin className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="LinkedIn"
                  value={profile_data.contacts.linkedin}
                  onChange={(e) => handleContactChange("linkedin", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Twitter className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Twitter"
                  value={profile_data.contacts.twitter}
                  onChange={(e) => handleContactChange("twitter", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Instagram className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Instagram"
                  value={profile_data.contacts.instagram}
                  onChange={(e) => handleContactChange("instagram", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Send className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Telegram"
                  value={profile_data.contacts.telegram}
                  onChange={(e) => handleContactChange("telegram", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="WhatsApp"
                  value={profile_data.contacts.whatsapp}
                  onChange={(e) => handleContactChange("whatsapp", e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <button 
          onClick={() => set_active_view("overview")}
          className="px-8 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold hover:bg-slate-300 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveProfile}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );



  const renderJobBlock = (job, type) => (
    <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
            <a href={job.link} className="flex items-center">
              {job.title}
              <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            Employer: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.employer}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 dark:text-white">{job.amount} {freelancer.balances.currency}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
        {job.description}
      </p>

      {job.note && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-l-2 border-indigo-500 p-3 mb-4">
          <p className="text-xs italic text-indigo-700 dark:text-indigo-300">
            <span className="font-bold not-italic mr-1 text-[10px] uppercase">My Note:</span>
            "{job.note}"
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex -space-x-2">
           {/* Avatar placeholder for employer */}
           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold">
            {(job.employer && job.employer.trim()) ? job.employer.charAt(0) : "?"}
           </div>
        </div>
        <div className="flex gap-2">
          {type === "requested" && (
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
              Agree to Job
            </button>
          )}
          <a href={job.link} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            View Details
          </a>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
              {active_view === 'overview' ? (
                <>
                  <LayoutDashboard className="w-8 h-8 mr-3 text-indigo-600" />
                  Freelancer Dashboard
                </>
              ) : (
                <>
                  <User className="w-8 h-8 mr-3 text-indigo-600" />
                  Edit Profile
                </>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {active_view === 'overview'
                ? <>Welcome back, <span className="font-bold text-slate-700 dark:text-slate-300">{freelancer.name}</span>. Here's what's happening today.</>
                : <>Update your profile information to attract more clients.</>
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mr-2">
              <button 
                onClick={() => set_active_view("overview")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${active_view === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Work Dashboard
              </button>
              <button 
                onClick={() => set_active_view("profile")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${active_view === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <User className="w-3.5 h-3.5" />
                Profile Settings
              </button>
            </div>
            
            {/* Mobile View Switcher */}
            <div className="sm:hidden flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mr-2">
               <button 
                onClick={() => set_active_view("overview")}
                className={`p-1.5 rounded-lg transition-all ${active_view === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                title="Work Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
              <button 
                onClick={() => set_active_view("profile")}
                className={`p-1.5 rounded-lg transition-all ${active_view === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                title="Profile Settings"
              >
                <User className="w-4 h-4" />
              </button>
            </div>

            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button 
              onClick={() => set_active_view("profile")}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-900 shadow-sm overflow-hidden">
              {profile_data.profile_picture ? (
                <img src={profile_data.profile_picture} alt={freelancer.name} className="h-full w-full object-cover" />
              ) : (
                (freelancer.name && freelancer.name.trim() ? freelancer.name.charAt(0) : " ")
              )}
            </div>
          </div>
        </div>

        {active_view === 'profile' ? (
          renderProfileSettings()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar: Financials & Public Addresses */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Wallet Balances */}
              <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Coins className="w-32 h-32" />
                </div>
                <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4">Total Balance</h3>
                <div className="mb-6">
                  <p className="text-3xl font-black mb-1">{freelancer.balances.stableCoin.toLocaleString()} <span className="text-lg font-medium">{freelancer.balances.currency}</span></p>
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5% this month
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="text-xs text-indigo-100">RP Tokens Staked</span>
                    <span className="font-bold">{freelancer.balances.rpTokens.toLocaleString()} RP</span>
                  </div>
                </div>
              </div>

              {/* Public Addresses */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                  Linked Wallets
                </h3>
                <div className="space-y-4">
                  {Object.entries(freelancer.publicAddresses).map(([chain, address]) => (
                    <div key={chain} className="group">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{chain}</p>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-colors">
                        <code className="text-[10px] text-slate-600 dark:text-slate-400 truncate w-32">
                          {address}
                        </code>
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Success</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{freelancer.stats.successRate}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Jobs</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{freelancer.stats.totalJobs}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Successful Jobs</p>
                    <p className="text-lg font-black text-emerald-600">{freelancer.stats.successfulJobs}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content: Job Lists */}
            <div className="lg:col-span-3">
              
              {/* Quick Filter Tabs */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-1 mb-6">
                {jobTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-white" : tab.color || ""}`} />
                      {tab.label}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Job List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {jobTabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search jobs..."
                      className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {freelancer.jobs[activeTab].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {freelancer.jobs[activeTab].map(job => renderJobBlock(job, activeTab))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Briefcase className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">No jobs in this category</h3>
                    <p className="text-sm text-slate-500 max-w-xs">
                      You don't have any jobs listed under {jobTabs.find(t => t.id === activeTab)?.label.toLowerCase()} yet.
                    </p>
                    <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-colors">
                      Browse Marketplace
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions / News */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden group">
                  <Flame className="w-32 h-32 absolute -right-8 -bottom-8 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
                  <h4 className="font-bold mb-2">Boost Your Profile</h4>
                  <p className="text-sm text-slate-400 mb-4 max-w-xs">Stake 5,000 more RP tokens to get a "Top Rated" badge and 20% lower platform fees.</p>
                  <button className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                    Stake Now
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Community Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Milestone Approved</p>
                        <p className="text-[10px] text-slate-500">Nexus Finance approved 'Design Phase'</p>
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">New Message</p>
                        <p className="text-[10px] text-slate-500">ArtBlock sent you a message</p>
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400">5h ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
