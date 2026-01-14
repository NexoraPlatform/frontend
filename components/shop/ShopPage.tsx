"use client";

import { useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
};

const PAGE_SIZE = 12;
const TOTAL_PRODUCTS = 72;

const categories = ["Audio", "Home", "Travel", "Wellness", "Workspace"];

const buildProducts = (): Product[] =>
  Array.from({ length: TOTAL_PRODUCTS }, (_, index) => {
    const id = index + 1;
    const category = categories[index % categories.length];
    const price = 24 + (index % 8) * 6 + id * 0.5;

    return {
      id,
      name: `${category} Essential ${id}`,
      description: `Curated ${category.toLowerCase()} pick with premium materials and thoughtful design.`,
      category,
      price,
    };
  });

export default function ShopPage() {
  const allProducts = useMemo(() => buildProducts(), []);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>(() =>
    allProducts.slice(0, PAGE_SIZE),
  );
  const [hasMore, setHasMore] = useState(
    visibleProducts.length < allProducts.length,
  );

  const fetchMoreData = useCallback(() => {
    setVisibleProducts((prev) => {
      const next = allProducts.slice(0, prev.length + PAGE_SIZE);
      setHasMore(next.length < allProducts.length);
      return next;
    });
  }, [allProducts]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Curated drop
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Shop the essentials
            </h1>
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
              Discover our newest arrivals and keep scrolling to reveal more
              favorites. We load additional products automatically as you reach
              the end of the list.
            </p>
          </div>
        </header>

        <InfiniteScroll
          dataLength={visibleProducts.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={
            <div className="py-6 text-center text-sm text-slate-400">
              Loading more products...
            </div>
          }
          endMessage={
            <div className="py-6 text-center text-sm text-slate-400">
              You have reached the end of the collection.
            </div>
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/30"
              >
                <div className="space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {product.category}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">
                      {product.name}
                    </h2>
                    <p className="text-sm text-slate-300">
                      {product.description}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">
                    ${product.price.toFixed(2)}
                  </span>
                  <button className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800">
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </main>
  );
}
