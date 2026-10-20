import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Wishlist, WishlistInput } from "../../types";

export function useWishlists() {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlists = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("wishlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setWishlists(data as Wishlist[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  const addWishlist = async (input: WishlistInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("wishlists")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchWishlists();
    return { error: null };
  };

  const updateWishlist = async (id: string, input: Partial<WishlistInput>) => {
    const { error } = await db
      .from("wishlists")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchWishlists();
    return { error: null };
  };

  const deleteWishlist = async (id: string) => {
    const { error } = await db.from("wishlists").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchWishlists();
    return { error: null };
  };

  return { wishlists, loading, addWishlist, updateWishlist, deleteWishlist };
}
