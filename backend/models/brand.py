from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field
import uuid


class BrandColors(BaseModel):
    primary: str = "#000000"
    secondary: str = "#ffffff"
    accent: str = "#0066cc"
    background: str = "#ffffff"
    text: str = "#111111"
    palette: list[str] = Field(default_factory=list)


class BrandTypography(BaseModel):
    heading_font: str = "Inter"
    body_font: str = "Inter"
    font_sizes: dict[str, str] = Field(default_factory=lambda: {
        "xs": "12px", "sm": "14px", "base": "16px",
        "lg": "18px", "xl": "20px", "2xl": "24px",
        "3xl": "30px", "4xl": "36px", "5xl": "48px"
    })
    font_weights: dict[str, int] = Field(default_factory=lambda: {
        "light": 300, "normal": 400, "medium": 500,
        "semibold": 600, "bold": 700, "extrabold": 800
    })


class BrandSpacing(BaseModel):
    base: str = "8px"
    scale: list[int] = Field(default_factory=lambda: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128])


class ToneOfVoice(BaseModel):
    personality: list[str] = Field(default_factory=list)  # e.g. ["professional", "friendly"]
    avoid: list[str] = Field(default_factory=list)         # e.g. ["jargon", "negativity"]
    example_copy: list[str] = Field(default_factory=list)


class LogoInfo(BaseModel):
    description: str = ""
    svg_code: str | None = None
    usage_rules: list[str] = Field(default_factory=list)


class BrandProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "My Brand"
    colors: BrandColors = Field(default_factory=BrandColors)
    typography: BrandTypography = Field(default_factory=BrandTypography)
    spacing: BrandSpacing = Field(default_factory=BrandSpacing)
    tone_of_voice: ToneOfVoice = Field(default_factory=ToneOfVoice)
    logo: LogoInfo = Field(default_factory=LogoInfo)
    design_principles: list[str] = Field(default_factory=list)
    industry: str = ""
    target_audience: str = ""
    raw_guidelines_text: str = ""
    source: Literal["pdf", "form", "url", "none"] = "none"
    source_url: str | None = None

    def to_designer_context(self) -> str:
        """Returns a rich text summary for injecting into AI prompts."""
        lines = [
            f"Brand: {self.name}",
            f"Industry: {self.industry}",
            f"Target Audience: {self.target_audience}",
            f"",
            f"Colors:",
            f"  Primary: {self.colors.primary}",
            f"  Secondary: {self.colors.secondary}",
            f"  Accent: {self.colors.accent}",
            f"  Background: {self.colors.background}",
            f"  Text: {self.colors.text}",
        ]
        if self.colors.palette:
            lines.append(f"  Palette: {', '.join(self.colors.palette)}")
        lines += [
            f"",
            f"Typography:",
            f"  Heading Font: {self.typography.heading_font}",
            f"  Body Font: {self.typography.body_font}",
            f"",
            f"Tone of Voice:",
            f"  Personality: {', '.join(self.tone_of_voice.personality) or 'Not specified'}",
            f"  Avoid: {', '.join(self.tone_of_voice.avoid) or 'None'}",
        ]
        if self.tone_of_voice.example_copy:
            lines.append(f"  Example Copy:")
            for ex in self.tone_of_voice.example_copy[:3]:
                lines.append(f"    - \"{ex}\"")
        if self.design_principles:
            lines.append(f"")
            lines.append(f"Design Principles: {', '.join(self.design_principles)}")
        if self.logo.description:
            lines.append(f"")
            lines.append(f"Logo: {self.logo.description}")
            if self.logo.usage_rules:
                lines.append(f"  Usage Rules: {'; '.join(self.logo.usage_rules)}")
        if self.raw_guidelines_text:
            lines.append(f"")
            lines.append(f"Additional Guidelines (excerpt):")
            lines.append(self.raw_guidelines_text[:2000])
        return "\n".join(lines)
