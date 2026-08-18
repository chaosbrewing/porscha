import type { Metadata } from "next";
import {
  PhotographyForm,
  type SlotRow,
} from "@/components/console/PhotographyForm";
import {
  appFrameDefault,
  appFrameSlot,
  photography,
  PHOTO_SLOT_META,
} from "@/config/photography";
import { getPhotographySettings } from "@/server/photography/service";
import { resolveSlot } from "@/server/photography/resolve";
import { getPublicProjects } from "@/server/projects/service";
import { getProjectStory } from "@/server/content/loader";
import { isMediaConfigured } from "@/server/media/storage";

export const metadata: Metadata = { title: "Photography" };

export const dynamic = "force-dynamic";

/**
 * Photography settings.
 *
 * The rows are assembled here rather than in the client: fixed slots
 * come from the registry, and one frame per app comes from the project
 * list, so registering a new app puts its frame in this editor without
 * a code change.
 */
export default async function PhotographySettingsPage() {
  const [settings, { projects }] = await Promise.all([
    getPhotographySettings(),
    getPublicProjects(),
  ]);

  const fixed: SlotRow[] = PHOTO_SLOT_META.map((meta) => {
    const base = photography[meta.key];
    const current = resolveSlot(settings, meta.key);
    return {
      key: meta.key,
      where: meta.where,
      label: meta.label,
      brief: base.brief,
      current: {
        src: current.src,
        alt: current.alt,
        aspect: current.aspect,
        focal: current.focal,
        caption: current.caption,
      },
      fallback: { src: base.src, aspect: base.aspect },
    };
  });

  const appRows: SlotRow[] = projects
    .filter((project) => project.isApp)
    .map((project) => {
      const key = appFrameSlot(project.slug);
      // A project's own story screenshot is the frame's default, so
      // content already written stays in charge until the console says
      // otherwise.
      const shot = getProjectStory(project.slug)?.screenshots[0];
      const base = appFrameDefault(project.name, shot);
      const current = resolveSlot(settings, key, base);
      return {
        key,
        where: "Apps",
        label: `${project.name} frame`,
        brief: base.brief,
        current: {
          src: current.src,
          alt: current.alt,
          aspect: current.aspect,
          focal: current.focal,
          caption: current.caption,
        },
        fallback: { src: base.src, aspect: base.aspect },
      };
    });

  return (
    <div>
      <h2 className="type-heading text-xl">Photography</h2>
      <div className="mt-4">
        <PhotographyForm
          rows={[...fixed, ...appRows]}
          initial={settings}
          uploadsConfigured={isMediaConfigured()}
        />
      </div>
    </div>
  );
}
