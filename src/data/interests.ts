import type { ImageMetadata } from "astro";
import offClock from "@/assets/scrapbook/free-use-v5/gaming-joy-con-v5.jpg";
import gym from "@/assets/scrapbook/free-use-v5/sunlit-gym-v5.jpg";
import travel from "@/assets/scrapbook/free-use-v5/alpine-lake-v5.jpg";
import finance from "@/assets/scrapbook/free-use-v5/market-chart-v5.jpg";

export interface Interest {
  id: "off-clock" | "gym" | "travel" | "finance";
  title: string;
  caption: string;
  image: ImageMetadata;
  alt: string;
  objectPosition?: string;
  /** The photographer and source page, kept as a record. The Unsplash
      License needs no credit on the page, so the page does not show it. */
  credit: { label: string; href: string };
}

export const interests: Interest[] = [
  {
    id: "off-clock",
    title: "Anime, games & light novels",
    caption: "Ask me about any of them and I can go a while.",
    image: offClock,
    alt: "Close-up photograph of blue and red Nintendo Switch controllers in warm window light.",
    objectPosition: "65% 48%",
    credit: {
      label: "Photo: Enrique Vidal Flores / Unsplash",
      href: "https://unsplash.com/photos/nintendo-switch-zsXvRKtsf6Q",
    },
  },
  {
    id: "gym",
    title: "Four evenings a week",
    caption: "In the gym, with a good reason to close the laptop.",
    image: gym,
    alt: "Sunlight falls across a barbell, weight plates and bench in an empty gym.",
    objectPosition: "68% center",
    credit: {
      label: "Photo: Jelmer Assink / Unsplash",
      href: "https://unsplash.com/photos/barbell-on-rack-gzeTjGu3b_k",
    },
  },
  {
    id: "travel",
    title: "The next trip",
    caption: "There's usually one half-planned.",
    image: travel,
    alt: "A wooden boathouse and mountain peaks reflected in the still water of Lago di Braies.",
    objectPosition: "62% center",
    credit: {
      label: "Photo: Luca Bravo / Unsplash",
      href: "https://unsplash.com/photos/brown-house-near-body-of-water-zAjdgNXsMeg",
    },
  },
  {
    id: "finance",
    title: "Investing & personal finance",
    caption: "Something I read about most weeks.",
    image: finance,
    alt: "Photograph of red and green candlesticks and moving-average lines on a financial market screen.",
    objectPosition: "center",
    credit: {
      label: "Photo: Maxim Hopman / Unsplash",
      href: "https://unsplash.com/photos/stock-market-candlestick-chart-on-dark-screen-fiXLQXAhCfk",
    },
  },
];
