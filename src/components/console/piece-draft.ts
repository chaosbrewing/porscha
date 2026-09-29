/**
 * The piece form's value shape and its empty draft. Kept out of the
 * client component file so server pages can build a draft (spread it,
 * set a default category) without touching a client reference.
 */
export type PieceFormValue = {
  slug: string;
  title: string;
  category: string;
  year: string;
  alt: string;
  media: string;
  aspect: string;
  note: string;
  body: string;
  forSale: boolean;
  price: string;
  currency: string;
};

export const emptyPieceDraft: PieceFormValue = {
  slug: "",
  title: "",
  category: "canvas",
  year: String(new Date().getFullYear()),
  alt: "",
  media: "",
  aspect: "4/5",
  note: "",
  body: "",
  forSale: false,
  price: "",
  currency: "",
};
