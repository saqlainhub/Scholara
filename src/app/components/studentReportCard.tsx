"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type StudentReportCardTask = {
  serial: number;
  title: string;

  submitted: boolean;
  checked: boolean;

  difficulty: number | null;
  points: number | null;

  status: "Ontime" | "Delayed" | null;

  submittedAt: string | null;
};

export type StudentReportCardData = {
  student: {
    id: string;
    name: string;
    username: string;
    profileImg?: string | null;
  };

  date: string;
  dateLabel: string;

  dayType: "Working" | "Off";

  totalTasks: number;
  submittedTasks: number;
  checkedTasks: number;

  totalScore: number;
  obtainedScore: number;

  performanceRate: number;

  leaderboardPosition: number | null;

  tasks: StudentReportCardTask[];
};

type StudentReportCardProps = {
  data: StudentReportCardData;

  backHref?: string;

  backLabel?: string;
};

const MAX_POINTS = 5;

/*
|--------------------------------------------------------------------------
| Scholara PDF colors
|--------------------------------------------------------------------------
|
| These are deliberately standard HEX/RGB colors.
|
| html2canvas can fail when Tailwind v4 produces colors such as:
|
|   oklab(...)
|   oklch(...)
|   color-mix(...)
|
| The normal UI can continue using CSS variables.
| The PDF export uses these safe colors.
|
*/

const PDF_COLORS = {
  navy950: "#07111F",
  navy900: "#0B1728",
  navy800: "#101F33",

  gold500: "#E6A000",
  gold400: "#F2B72E",

  textPrimary: "#F8FAFC",
  textMuted: "#94A3B8",

  border: "#26364A",

  white: "#FFFFFF",
  black: "#000000",

  successBackground: "rgba(230, 160, 0, 0.10)",
};

function formatNumber(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| Detect unsupported CSS colors
|--------------------------------------------------------------------------
*/

function hasUnsupportedColor(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("oklab(") ||
    normalized.includes("oklch(") ||
    normalized.includes("color-mix(")
  );
}

/*
|--------------------------------------------------------------------------
| Determine safe color for an element
|--------------------------------------------------------------------------
*/

function getSafeColor(
  element: HTMLElement,
  property:
    | "color"
    | "backgroundColor"
    | "borderColor"
    | "boxShadow"
) {
  const classes = Array.from(
    element.classList
  );

  const classString = classes.join(" ");

  /*
   * Gold
   */

  if (
    classString.includes("gold") ||
    classString.includes("--gold")
  ) {
    if (
      property === "backgroundColor"
    ) {
      return PDF_COLORS.gold500;
    }

    return PDF_COLORS.gold500;
  }

  /*
   * Muted text
   */

  if (
    classString.includes("text-(--text-muted)") ||
    classString.includes("text-muted")
  ) {
    return PDF_COLORS.textMuted;
  }

  /*
   * Primary text
   */

  if (
    classString.includes("text-(--text-primary)") ||
    classString.includes("text-primary")
  ) {
    return PDF_COLORS.textPrimary;
  }

  /*
   * Borders
   */

  if (
    property === "borderColor" ||
    classString.includes("border-(--border)")
  ) {
    return PDF_COLORS.border;
  }

  /*
   * Backgrounds
   */

  if (
    property === "backgroundColor"
  ) {
    if (
      classString.includes("navy-950")
    ) {
      return PDF_COLORS.navy950;
    }

    if (
      classString.includes("navy-800")
    ) {
      return PDF_COLORS.navy800;
    }

    return PDF_COLORS.navy900;
  }

  /*
   * Shadows
   */

  if (
    property === "boxShadow"
  ) {
    return "none";
  }

  /*
   * General fallback
   */

  if (property === "color") {
    return PDF_COLORS.textPrimary;
  }

  if (property === "backgroundColor") {
    return PDF_COLORS.navy900;
  }

  if (property === "borderColor") {
    return PDF_COLORS.border;
  }

  return "none";
}

/*
|--------------------------------------------------------------------------
| Sanitize cloned report card for html2canvas
|--------------------------------------------------------------------------
|
| This operates ONLY on the html2canvas clone.
|
| The actual website UI is never changed.
|
*/

function sanitizePdfClone(
  clonedDocument: Document,
  clonedElement: HTMLElement
) {
  /*
   * Force the Scholara CSS variables to standard colors.
   */

  clonedElement.style.setProperty(
    "--navy-950",
    PDF_COLORS.navy950
  );

  clonedElement.style.setProperty(
    "--navy-900",
    PDF_COLORS.navy900
  );

  clonedElement.style.setProperty(
    "--navy-800",
    PDF_COLORS.navy800
  );

  clonedElement.style.setProperty(
    "--gold-500",
    PDF_COLORS.gold500
  );

  clonedElement.style.setProperty(
    "--gold-400",
    PDF_COLORS.gold400
  );

  clonedElement.style.setProperty(
    "--text-primary",
    PDF_COLORS.textPrimary
  );

  clonedElement.style.setProperty(
    "--text-muted",
    PDF_COLORS.textMuted
  );

  clonedElement.style.setProperty(
    "--border",
    PDF_COLORS.border
  );

  /*
   * Also inject a PDF-only stylesheet.
   *
   * This catches Tailwind opacity/color-mix rules.
   */

  const style =
    clonedDocument.createElement(
      "style"
    );

  style.setAttribute(
    "data-scholara-pdf",
    "true"
  );

  style.textContent = `
    #student-report-card {
      background: ${PDF_COLORS.navy900} !important;
      color: ${PDF_COLORS.textPrimary} !important;
      border-color: ${PDF_COLORS.border} !important;
    }

    #student-report-card [class*="bg-(--navy-950)"] {
      background-color: ${PDF_COLORS.navy950} !important;
    }

    #student-report-card [class*="bg-(--navy-900)"] {
      background-color: ${PDF_COLORS.navy900} !important;
    }

    #student-report-card [class*="bg-(--navy-800)"] {
      background-color: ${PDF_COLORS.navy800} !important;
    }

    #student-report-card [class*="text-(--text-primary)"] {
      color: ${PDF_COLORS.textPrimary} !important;
    }

    #student-report-card [class*="text-(--text-muted)"] {
      color: ${PDF_COLORS.textMuted} !important;
    }

    #student-report-card [class*="text-(--gold-500)"] {
      color: ${PDF_COLORS.gold500} !important;
    }

    #student-report-card [class*="text-(--gold-400)"] {
      color: ${PDF_COLORS.gold400} !important;
    }

    #student-report-card [class*="border-(--border)"] {
      border-color: ${PDF_COLORS.border} !important;
    }

    #student-report-card [class*="border-(--gold-500)"] {
      border-color: ${PDF_COLORS.gold500} !important;
    }

    #student-report-card [class*="bg-(--gold-500)"] {
      background-color: ${PDF_COLORS.successBackground} !important;
    }
  `;

  clonedDocument.head.appendChild(
    style
  );

  /*
   * Walk through every cloned element.
   *
   * If html2canvas sees an unsupported color,
   * replace it with a safe RGB/HEX value.
   */

  const elements = [
    clonedElement,
    ...Array.from(
      clonedElement.querySelectorAll<HTMLElement>(
        "*"
      )
    ),
  ];

  for (const element of elements) {
    const computed =
      clonedDocument.defaultView?.getComputedStyle(
        element
      );

    if (!computed) {
      continue;
    }

    /*
     * Text color
     */

    if (
      hasUnsupportedColor(
        computed.color
      )
    ) {
      element.style.setProperty(
        "color",
        getSafeColor(
          element,
          "color"
        ),
        "important"
      );
    }

    /*
     * Background
     */

    if (
      hasUnsupportedColor(
        computed.backgroundColor
      )
    ) {
      element.style.setProperty(
        "background-color",
        getSafeColor(
          element,
          "backgroundColor"
        ),
        "important"
      );
    }

    /*
     * Border
     */

    if (
      hasUnsupportedColor(
        computed.borderColor
      )
    ) {
      element.style.setProperty(
        "border-color",
        getSafeColor(
          element,
          "borderColor"
        ),
        "important"
      );
    }

    /*
     * Box shadow
     */

    if (
      hasUnsupportedColor(
        computed.boxShadow
      )
    ) {
      element.style.setProperty(
        "box-shadow",
        "none",
        "important"
      );
    }

    /*
     * Text shadow
     */

    if (
      hasUnsupportedColor(
        computed.textShadow
      )
    ) {
      element.style.setProperty(
        "text-shadow",
        "none",
        "important"
      );
    }

    /*
     * Outline
     */

    if (
      hasUnsupportedColor(
        computed.outlineColor
      )
    ) {
      element.style.setProperty(
        "outline-color",
        PDF_COLORS.border,
        "important"
      );
    }
  }

  /*
   * html2canvas can sometimes inspect pseudo-elements.
   * Override their colors as well.
   */

  const pseudoStyle =
    clonedDocument.createElement(
      "style"
    );

  pseudoStyle.textContent = `
    #student-report-card *,
    #student-report-card *::before,
    #student-report-card *::after {
      text-shadow: none !important;
    }

    #student-report-card button {
      box-shadow: none !important;
    }
  `;

  clonedDocument.head.appendChild(
    pseudoStyle
  );
}

/*
|--------------------------------------------------------------------------
| Summary card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-(--border)
        bg-(--navy-900)
        px-4
        py-3
      "
    >
      <p
        className="
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.14em]
          text-(--text-muted)
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xl
          font-bold
          tracking-tight
          text-(--text-primary)
        "
      >
        {value}

        {suffix && (
          <span
            className="
              ml-1
              text-sm
              font-medium
              text-(--text-muted)
            "
          >
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Student Report Card
|--------------------------------------------------------------------------
*/

export default function StudentReportCard({
  data,
  backHref,
  backLabel = "Back",
}: StudentReportCardProps) {
  const [downloading, setDownloading] =
    useState(false);

  async function downloadReportCard() {
    if (downloading) {
      return;
    }

    const element =
      document.getElementById(
        "student-report-card"
      ) as HTMLElement | null;

    if (!element) {
      console.error(
        "Student report card element was not found."
      );

      return;
    }

    setDownloading(true);

    try {
      /*
       * Give the browser one frame to render
       * before starting the expensive capture.
       */

      await new Promise<void>(
        (resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        }
      );

      /*
       * Generate the canvas.
       *
       * IMPORTANT:
       *
       * onclone receives a separate DOM tree.
       * Therefore all PDF color modifications
       * happen only inside the clone.
       *
       * The actual report card visible on the
       * website remains untouched.
       */

      const canvas =
        await html2canvas(element, {
          scale: 2,

          useCORS: true,

          allowTaint: false,

          backgroundColor:
            PDF_COLORS.navy950,

          logging: false,

          imageTimeout: 15000,

          removeContainer: true,

          windowWidth:
            element.scrollWidth,

          windowHeight:
            element.scrollHeight,

          onclone: (
            clonedDocument
          ) => {
            const clonedElement =
              clonedDocument.getElementById(
                "student-report-card"
              ) as HTMLElement | null;

            if (!clonedElement) {
              return;
            }

            sanitizePdfClone(
              clonedDocument,
              clonedElement
            );
          },
        });

      /*
       * Convert canvas to PNG.
       */

      const imageData =
        canvas.toDataURL(
          "image/png",
          1
        );

      /*
       * Create exactly one A4 page.
       */

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      /*
       * Small margin so the report card has
       * some breathing room around the page.
       */

      const margin = 5;

      const availableWidth =
        pageWidth - margin * 2;

      const availableHeight =
        pageHeight - margin * 2;

      /*
       * Canvas aspect ratio.
       */

      const imageRatio =
        canvas.height /
        canvas.width;

      /*
       * Start by fitting to width.
       */

      let imageWidth =
        availableWidth;

      let imageHeight =
        imageWidth * imageRatio;

      /*
       * If height is too large,
       * fit to page height instead.
       *
       * This guarantees that the complete
       * report remains on ONE page.
       */

      if (
        imageHeight >
        availableHeight
      ) {
        imageHeight =
          availableHeight;

        imageWidth =
          imageHeight /
          imageRatio;
      }

      /*
       * Center image horizontally.
       */

      const x =
        (pageWidth -
          imageWidth) /
        2;

      /*
       * Center image vertically.
       */

      const y =
        (pageHeight -
          imageHeight) /
        2;

      /*
       * Add exactly one image.
       *
       * We intentionally NEVER call:
       *
       * pdf.addPage()
       *
       * Therefore the generated PDF has exactly
       * one page.
       */

      pdf.addImage(
        imageData,
        "PNG",
        x,
        y,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );

      /*
       * Safe filename.
       */

      const safeStudentName =
        data.student.name
          .trim()
          .replace(
            /[^a-zA-Z0-9-_ ]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          );

      const fileName =
        `Scholara-Report-Card-${
          safeStudentName ||
          "Student"
        }-${data.date}.pdf`;

      /*
       * Immediately download.
       *
       * No print dialog.
       */

      pdf.save(fileName);
    } catch (error) {
      console.error(
        "Failed to generate report card PDF:",
        error
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="
        min-h-full
        bg-(--navy-950)
        px-4
        py-5
        sm:px-6
        lg:px-8
      "
    >
      {/* =====================================================
          ACTION BAR
      ====================================================== */}

      <div
        className="
          mb-5
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {backHref ? (
          <Link
            href={backHref}
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-xl
              border
              border-(--border)
              bg-(--navy-900)
              px-4
              py-2.5
              text-sm
              font-medium
              text-(--text-primary)
              transition
              hover:border-(--gold-500)
              hover:text-(--gold-500)
            "
          >
            <ArrowLeft
              size={17}
              strokeWidth={2}
            />

            {backLabel}
          </Link>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={
            downloadReportCard
          }
          disabled={downloading}
          className="
            inline-flex
            w-fit
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-(--gold-500)
            px-5
            py-2.5
            text-sm
            font-bold
            text-(--navy-950)
            shadow-lg
            shadow-black/10
            transition
            hover:brightness-105
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          {downloading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              Preparing PDF...
            </>
          ) : (
            <>
              <Download
                size={17}
                strokeWidth={2}
              />

              Report Card
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          REPORT CARD
      ====================================================== */}

      <div
        id="student-report-card"
        className="
          mx-auto
          w-full
          max-w-7xl
          overflow-hidden
          rounded-2xl
          border
          border-(--border)
          bg-(--navy-900)
          text-(--text-primary)
          shadow-2xl
        "
      >
        {/* ===================================================
            REPORT HEADER
        ================================================== */}

        <div
          className="
            border-b
            border-(--border)
            bg-(--navy-800)
            px-5
            py-5
            sm:px-7
            sm:py-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            {/* BRAND + STUDENT */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-4
              "
            >
              {/* PROFILE */}

              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  border
                  border-(--gold-500)
                  bg-(--navy-950)
                  text-lg
                  font-bold
                  text-(--gold-500)
                "
              >
                {data.student.profileImg ? (
                  <img
                    src={
                      data.student
                        .profileImg
                    }
                    alt={
                      data.student.name
                    }
                    crossOrigin="anonymous"
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  getInitials(
                    data.student.name
                  )
                )}
              </div>

              {/* TITLE */}

              <div className="min-w-0">
                

                <h1
                  className="
                    mt-0.5
                    text-2xl
                    font-bold
                    tracking-tight
                    text-(--text-primary)
                    sm:text-3xl
                  "
                >
                  {data.student.name}
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    text-(--text-muted)
                  "
                >
                  username: @{data.student.username}
                </p>
              </div>
            </div>

            {/* DATE */}

            <div className="sm:text-right">
              

              <p
                className="
                  mt-1
                  text-base
                  font-semibold
                  text-(--text-primary)
                "
              >
                {data.dateLabel}
              </p>

              <span
                className={`
                  mt-2
                  inline-flex
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-bold
                  ${
                    data.dayType ===
                    "Working"
                      ? `
                        border-(--gold-500)
                        text-(--gold-500)
                      `
                      : `
                        border-(--border)
                        text-(--text-muted)
                      `
                  }
                `}
              >
                {data.dayType}
              </span>
            </div>
          </div>
        </div>



        {/* ===================================================
            PROGRESS SUMMARY
        ================================================== */}

        <div
          className="
            px-5
            pb-5
            pt-10
            sm:px-7
          "
        >
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <h2
              className="
                text-base
                font-bold
                text-(--text-primary)
              "
            >
              Progress Summary
            </h2>

            <div
              className="
                ml-4
                h-px
                flex-1
                bg-(--border)
              "
            />
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-3
              lg:grid-cols-6
            "
          >
            <SummaryCard
              label="Total Tasks"
              value={
                data.totalTasks
              }
            />

            <SummaryCard
              label="Submitted"
              value={
                data.submittedTasks
              }
            />

            <SummaryCard
              label="Checked"
              value={
                data.checkedTasks
              }
            />

            <SummaryCard
              label="Total Score"
              value={formatNumber(
                data.totalScore
              )}
            />

            <SummaryCard
              label="Obtained"
              value={formatNumber(
                data.obtainedScore
              )}
            />

            <SummaryCard
              label="Performance"
              value={data.performanceRate.toFixed(
                2
              )}
              suffix="%"
            />
          </div>

          {/* LEADERBOARD */}

          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-(--gold-500)
              bg-(--gold-500)/10
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-(--text-muted)
                "
              >
                Leaderboard Position
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-(--text-muted)
                "
              >
                Difficulty × obtained
                points
              </p>
            </div>

            <p
              className="
                text-2xl
                font-black
                text-(--gold-500)
              "
            >
              {data.leaderboardPosition !==
              null
                ? `#${data.leaderboardPosition}`
                : "—"}
            </p>
          </div>
        </div>

        {/* ===================================================
            TASK DETAILS
        ================================================== */}

        <div
          className="
            px-5
            pb-6
            sm:px-7
          "
        >
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <h2
              className="
                text-base
                font-bold
                text-(--text-primary)
              "
            >
              Tasks Detail
            </h2>

            <div
              className="
                ml-4
                h-px
                flex-1
                bg-(--border)
              "
            />
          </div>

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-(--border)
            "
          >
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  min-w-[850px]
                  border-collapse
                  text-sm
                "
              >
                <thead>
                  <tr
                    className="
                      bg-(--navy-800)
                    "
                  >
                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-left
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      #
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-left
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Name
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-center
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Checked
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-center
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Difficulty
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-center
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Points
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-center
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Status
                    </th>

                    <th
                      className="
                        border-b
                        border-(--border)
                        px-3
                        py-2.5
                        text-right
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-(--text-muted)
                      "
                    >
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.tasks.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="
                          px-4
                          py-8
                          text-center
                          text-sm
                          text-(--text-muted)
                        "
                      >
                        No tasks were
                        assigned for
                        this day.
                      </td>
                    </tr>
                  ) : (
                    data.tasks.map(
                      (task) => (
                        <tr
                          key={
                            task.serial
                          }
                          className="
                            border-b
                            border-(--border)
                            last:border-b-0
                          "
                        >
                          {/* SERIAL */}

                          <td
                            className="
                              px-3
                              py-2.5
                              font-semibold
                              text-(--text-muted)
                            "
                          >
                            {
                              task.serial
                            }
                          </td>

                          {/* NAME */}

                          <td
                            className="
                              max-w-[360px]
                              px-3
                              py-2.5
                              font-medium
                              text-(--text-primary)
                            "
                          >
                            {
                              task.title
                            }
                          </td>

                          {/* CHECKED */}

                          <td
                            className="
                              px-3
                              py-2.5
                              text-center
                            "
                          >
                            {task.submitted ? (
                              task.checked ? (
                                <span
                                  className="
                                    font-semibold
                                    text-(--gold-500)
                                  "
                                >
                                  Yes
                                </span>
                              ) : (
                                <span
                                  className="
                                    text-(--text-muted)
                                  "
                                >
                                  No
                                </span>
                              )
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* DIFFICULTY */}

                          <td
                            className="
                              px-3
                              py-2.5
                              text-center
                              font-semibold
                              text-(--text-primary)
                            "
                          >
                            {task.difficulty !==
                            null
                              ? `${task.difficulty}x`
                              : "—"}
                          </td>

                          {/* POINTS */}

                          <td
                            className="
                              px-3
                              py-2.5
                              text-center
                              font-semibold
                              text-(--text-primary)
                            "
                          >
                            {task.points !==
                            null
                              ? `${formatNumber(
                                  task.points
                                )}/${MAX_POINTS}`
                              : "—"}
                          </td>

                          {/* STATUS */}

                          <td
                            className="
                              px-3
                              py-2.5
                              text-center
                            "
                          >
                            {task.status ? (
                              <span
                                className={
                                  task.status ===
                                  "Delayed"
                                    ? `
                                      font-semibold
                                      text-(--text-muted)
                                    `
                                    : `
                                      font-semibold
                                      text-(--gold-500)
                                    `
                                }
                              >
                                {
                                  task.status
                                }
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* TIME */}

                          <td
                            className="
                              px-3
                              py-2.5
                              text-right
                              text-xs
                              text-(--text-muted)
                            "
                          >
                            {task.submittedAt ??
                              "—"}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===================================================
            FOOTER
        ================================================== */}

        <div
          className="
            border-t
            border-(--border)
            bg-(--navy-800)
            px-5
            py-3
            text-center
            sm:px-7
          "
        >
          <p
            className="
              text-[10px]
              font-medium
              tracking-wide
              text-(--text-muted)
            "
          >
            Scholara • Daily
            Student Performance
            Report
          </p>
        </div>
      </div>
    </div>
  );
}