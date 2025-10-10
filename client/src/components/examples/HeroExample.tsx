import { ThemeProvider } from "../ThemeProvider";
import { Hero } from "../Hero";

export default function HeroExample() {
  return (
    <ThemeProvider>
      <Hero
        onGetStartedClick={() => console.log("Get started clicked")}
        onLearnMoreClick={() => console.log("Learn more clicked")}
      />
    </ThemeProvider>
  );
}
