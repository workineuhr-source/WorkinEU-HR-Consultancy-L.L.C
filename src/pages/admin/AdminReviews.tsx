import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Review } from "../../types";
import { toast } from "sonner";
import {
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

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

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFirestoreError = (
    error: unknown,
    operationType: OperationType,
    path: string | null,
  ) => {
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
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Review,
      );
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "pending",
  ) => {
    try {
      await updateDoc(doc(db, "reviews", id), { status });
      toast.success(
        `Review ${status === "approved" ? "approved" : "moved to pending"}`,
      );
      fetchReviews();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${id}`);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "reviews", deleteId));
      toast.success("Review deleted");
      setDeleteId(null);
      fetchReviews();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${deleteId}`);
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="animate-pulse h-96 bg-white dark:bg-[#121212] rounded-2xl"></div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">
            User Reviews
          </h1>
          <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base">
            Approve or reject reviews submitted by users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-300">
              No reviews submitted yet.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center"
            >
              <div className="shrink-0 hidden sm:block">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-blue/5 rounded-full flex items-center justify-center text-brand-blue font-bold">
                  <User size={20} className="md:w-6 md:h-6" />
                </div>
              </div>

              <div className="flex-grow space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <h3 className="font-bold text-brand-blue text-sm md:text-base">
                    {review.userName}
                  </h3>
                  <div className="flex items-center gap-0.5 md:gap-1 text-brand-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className="md:w-[14px] md:h-[14px]"
                        fill={i < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      review.status === "approved"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600",
                    )}
                  >
                    {review.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic text-xs md:text-base">
                  "{review.comment}"
                </p>
                <div className="flex items-center gap-2 text-[9px] md:text-xs text-gray-400">
                  <Clock size={10} className="md:w-3 md:h-3" />
                  <span>{format(review.createdAt, "MMM dd, yyyy HH:mm")}</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                {review.status === "pending" ? (
                  <button
                    onClick={() => handleStatusUpdate(review.id, "approved")}
                    className="flex-1 md:flex-none px-4 py-2.5 md:p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all flex items-center justify-center gap-2 font-bold text-xs md:text-sm"
                  >
                    <CheckCircle
                      size={16}
                      className="md:w-[18px] md:h-[18px]"
                    />{" "}
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusUpdate(review.id, "pending")}
                    className="flex-1 md:flex-none px-4 py-2.5 md:p-3 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-all flex items-center justify-center gap-2 font-bold text-xs md:text-sm"
                  >
                    <XCircle size={16} className="md:w-[18px] md:h-[18px]" />{" "}
                    Unapprove
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(review.id)}
                  className="p-2.5 md:p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                >
                  <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-blue mb-2">
                Delete Review?
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-8">
                This action cannot be undone. Are you sure you want to delete
                this review?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
