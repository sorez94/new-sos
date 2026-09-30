import localFont from "next/font/local";

/** Latin display font used by SOS. */
export const glacier = localFont({
  src: "../assets/fonts/Glacier.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-glacier",
});

/** Persian font used by SOS. */
export const yekan = localFont({
  src: "../assets/fonts/yekan.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-yekan",
});
