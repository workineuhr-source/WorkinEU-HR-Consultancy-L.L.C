import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Job, Application } from "../../types";
import {
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Settings,
  MessageCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    activeCandidates: 0,
    pendingApplications: 0,
    totalMessages: 0,
    totalDiaryPosts: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [distributionError, setDistributionError] = useState<string | null>(
    null,
  );
  const [recentAppsError, setRecentAppsError] = useState<string | null>(null);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [recentAppsStatusFilter, setRecentAppsStatusFilter] = useState("all");

  const recentApplications = useMemo(() => {
    let filtered = allApplications;
    if (recentAppsStatusFilter !== "all") {
      filtered = filtered.filter(app => app.status === recentAppsStatusFilter);
    }
    return filtered.slice(0, 5);
  }, [allApplications, recentAppsStatusFilter]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setErrorMessage(null);
        setTrendsError(null);
        setDistributionError(null);
        setRecentAppsError(null);

        const [jobsSnap, appsSnap, messagesSnap, candidatesSnap, diarySnap] =
          await Promise.all([
            getDocs(collection(db, "jobs")).catch((err) => {
              console.error("Jobs fetch error:", err);
              return { size: 0, docs: [] };
            }),
            getDocs(collection(db, "applications")).catch((err) => {
              console.error("Applications fetch error:", err);
              setTrendsError("Failed to load application trends");
              setDistributionError("Failed to load status distribution");
              return null;
            }),
            getDocs(collection(db, "contactMessages")).catch(() => ({
              size: 0,
              docs: [],
            })),
            getDocs(collection(db, "candidates")).catch(() => ({
              size: 0,
              docs: [],
            })),
            getDocs(collection(db, "diary")).catch(() => ({
              size: 0,
              docs: [],
            })),
          ]);

        if (appsSnap) {
          const apps = (appsSnap as any).docs.map(
            (doc: any) => ({ id: doc.id, ...doc.data() }) as Application,
          ).sort((a: Application, b: Application) => b.createdAt - a.createdAt);
          setAllApplications(apps);

          setStats({
            totalJobs: jobsSnap.size,
            totalApplications: appsSnap.size,
            activeCandidates: candidatesSnap.size,
            pendingApplications: apps.filter((a: Application) => a.status === "pending")
              .length,
            totalMessages: messagesSnap.size,
            totalDiaryPosts: diarySnap.size,
          });

          // Prepare Chart Data (Last 7 Days)
          try {
            const last7Days = [...Array(7)]
              .map((_, i) => {
                const date = subDays(new Date(), i);
                const count = apps.filter((app) =>
                  isSameDay(new Date(app.createdAt), date),
                ).length;
                return {
                  name: format(date, "MMM dd"),
                  applications: count,
                  date: date,
                };
              })
              .reverse();
            setChartData(last7Days);
          } catch (err) {
            setTrendsError("Failed to process application trends");
          }

          // Prepare Status Data
          try {
            const statusCounts = {
              pending: apps.filter((a) => a.status === "pending").length,
              approved: apps.filter((a) => a.status === "approved").length,
              rejected: apps.filter((a) => a.status === "rejected").length,
            };
            setStatusData([
              {
                name: "Pending",
                value: statusCounts.pending,
                color: "#F59E0B",
              },
              {
                name: "Approved",
                value: statusCounts.approved,
                color: "#10B981",
              },
              {
                name: "Rejected",
                value: statusCounts.rejected,
                color: "#EF4444",
              },
            ]);
          } catch (err) {
            setDistributionError("Failed to process status distribution");
          }
        } else {
          setStats((prev) => ({ ...prev, totalJobs: jobsSnap.size }));
        }

      } catch (error: any) {
        console.error("Error fetching stats:", error);
        setErrorMessage(error.message || "Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      name: "Total Jobs",
      value: stats.totalJobs,
      icon: <Briefcase size={24} />,
      color: "bg-blue-500",
    },
    {
      name: "Total Applications",
      value: stats.totalApplications,
      icon: <Users size={24} />,
      color: "bg-purple-500",
    },
    {
      name: "Diary Stories",
      value: stats.totalDiaryPosts,
      icon: <Sparkles size={24} />,
      color: "bg-brand-gold",
    },
    {
      name: "Registered Candidates",
      value: stats.activeCandidates,
      icon: <TrendingUp size={24} />,
      color: "bg-green-500",
    },
    {
      name: "Contact Messages",
      value: stats.totalMessages,
      icon: <MessageCircle size={24} />,
      color: "bg-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-[#121212] rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-[#121212] rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 md:gap-6"
          >
            <div
              className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0",
                stat.color,
              )}
            >
              {stat.icon}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider truncate">
                {stat.name}
              </p>
              <p className="text-xl md:text-3xl font-bold text-brand-blue">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#121212] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-brand-blue">
                Application Trends
              </h3>
              <p className="text-xs md:text-sm text-gray-400">
                Number of applications received in the last 7 days
              </p>
            </div>
            <div className="p-2 md:p-3 bg-brand-blue/5 text-brand-blue rounded-xl">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full relative">
            {trendsError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/50 rounded-2xl border border-red-100 p-4 text-center">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="font-bold text-sm">{trendsError}</p>
                <p className="text-xs opacity-70 mt-1">
                  Please try refreshing the page
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003366" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#003366" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F3F4F6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#003366"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorApps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-brand-blue">
                Status Distribution
              </h3>
              <p className="text-xs md:text-sm text-gray-400">
                Current application statuses
              </p>
            </div>
            <div className="p-2 md:p-3 bg-brand-gold/5 text-brand-gold rounded-xl">
              <PieChartIcon size={20} />
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full relative">
            {distributionError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/50 rounded-2xl border border-red-100 p-4 text-center">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="font-bold text-sm">{distributionError}</p>
                <p className="text-xs opacity-70 mt-1">
                  Please try refreshing the page
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-lg md:text-xl font-bold text-brand-blue">
              Recent Applications
            </h3>
            <div className="flex items-center gap-4">
              <select
                className="px-4 py-2 bg-gray-50 dark:bg-[#1f1f1f] text-brand-blue font-bold rounded-lg outline-none border border-gray-200 text-sm"
                value={recentAppsStatusFilter}
                onChange={(e) => setRecentAppsStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Link
                to="/admin/applications"
                className="text-brand-gold font-bold text-xs md:text-sm flex items-center gap-1 whitespace-nowrap"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto relative">
            {recentAppsError ? (
              <div className="p-12 flex flex-col items-center justify-center text-red-500 bg-red-50/30">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="font-bold text-sm">{recentAppsError}</p>
              </div>
            ) : (
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-gray-50 text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 md:px-8 py-4">Candidate</th>
                    <th className="px-6 md:px-8 py-4">Job Position</th>
                    <th className="px-6 md:px-8 py-4">Status</th>
                    <th className="px-6 md:px-8 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        <p className="font-bold text-brand-blue text-sm md:text-base">
                          {app.fullName}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-400 truncate max-w-[150px]">
                          {app.email}
                        </p>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">
                          {app.jobTitle}
                        </p>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        <span
                          className={cn(
                            "px-2 md:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            app.status === "pending"
                              ? "bg-orange-100 text-orange-600"
                              : app.status === "approved"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600",
                          )}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-[10px] md:text-sm text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-brand-blue mb-8">
            Quick Actions
          </h3>
          <div className="space-y-4">
            <Link
              to="/admin/jobs"
              className="flex items-center justify-between p-4 bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-blue text-white rounded-lg flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <span className="font-bold text-brand-blue">Post New Job</span>
              </div>
              <ChevronRight
                className="text-gray-300 group-hover:text-brand-blue transition-colors"
                size={20}
              />
            </Link>
            <Link
              to="/admin/content"
              className="flex items-center justify-between p-4 bg-brand-gold/5 rounded-xl hover:bg-brand-gold/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-gold text-brand-blue rounded-lg flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <span className="font-bold text-brand-blue">
                  Update Website
                </span>
              </div>
              <ChevronRight
                className="text-gray-300 group-hover:text-brand-gold transition-colors"
                size={20}
              />
            </Link>
            <Link
              to="/admin/messages"
              className="flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <span className="font-bold text-brand-blue">View Messages</span>
              </div>
              <ChevronRight
                className="text-gray-300 group-hover:text-orange-500 transition-colors"
                size={20}
              />
            </Link>
            <Link
              to="/admin/candidates"
              className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
                  <Users size={20} />
                </div>
                <span className="font-bold text-brand-blue">
                  Manage Candidates
                </span>
              </div>
              <ChevronRight
                className="text-gray-300 group-hover:text-green-500 transition-colors"
                size={20}
              />
            </Link>
            <Link
              to="/admin/diary"
              className="flex items-center justify-between p-4 bg-brand-gold/10 rounded-xl hover:bg-brand-gold/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-gold text-brand-blue rounded-lg flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <span className="font-bold text-brand-blue">Manage Diary</span>
              </div>
              <ChevronRight
                className="text-gray-300 group-hover:text-brand-gold transition-colors"
                size={20}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
