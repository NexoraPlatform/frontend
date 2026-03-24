"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

import { TrustoraLandingBrand } from "@/components/homepage/trustora-landing/brand";
import { Link } from "@/lib/navigation";

import type { LandingFooterSection, LandingSocialLink } from "./types";

export function TrustoraLandingFooter() {
  const t = useTranslations("trustora.landing");

  const sections: LandingFooterSection[] = [
    {
      title: t("footer.sections.product.title"),
      links: [
        { name: t("footer.sections.product.links.features"), href: "/services" },
        { name: t("footer.sections.product.links.security"), href: "/help" },
        { name: t("footer.sections.product.links.pricing"), href: "/projects" },
        { name: t("footer.sections.product.links.api_docs"), href: "/help" },
      ],
    },
    {
      title: t("footer.sections.company.title"),
      links: [
        { name: t("footer.sections.company.links.about"), href: "/about" },
        { name: t("footer.sections.company.links.careers"), href: "/contact" },
        { name: t("footer.sections.company.links.blog"), href: "/help" },
        { name: t("footer.sections.company.links.press"), href: "/contact" },
      ],
    },
    {
      title: t("footer.sections.resources.title"),
      links: [
        { name: t("footer.sections.resources.links.documentation"), href: "/help" },
        { name: t("footer.sections.resources.links.help_center"), href: "/help" },
        { name: t("footer.sections.resources.links.community"), href: "/contact" },
        { name: t("footer.sections.resources.links.contact"), href: "/contact" },
      ],
    },
    {
      title: t("footer.sections.legal.title"),
      links: [
        { name: t("footer.sections.legal.links.privacy"), href: "/privacy" },
        { name: t("footer.sections.legal.links.terms"), href: "/terms" },
        { name: t("footer.sections.legal.links.security"), href: "/help" },
        { name: t("footer.sections.legal.links.compliance"), href: "/cookies" },
      ],
    },
  ];

  const socialLinks: LandingSocialLink[] = [
    { icon: Twitter, href: "#", label: t("footer.social.twitter") },
    { icon: Github, href: "#", label: t("footer.social.github") },
    { icon: Linkedin, href: "#", label: t("footer.social.linkedin") },
    { icon: Mail, href: "mailto:contact@trustora.ro", label: t("footer.social.email") },
  ];

  return (
    <footer className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-6 lg:gap-12">
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <TrustoraLandingBrand />
              <p className="max-w-xs text-muted-foreground">{t("footer.description")}</p>
              <div className="flex items-center space-x-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;

                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="glass-effect group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 hover:border-primary/40"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            >
              <h3 className="mb-4 font-bold">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.name}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center justify-between space-y-4 border-t border-white/5 pt-8 md:flex-row md:space-y-0"
        >
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>{t("footer.bottom.first")}</span>
            <span className="h-4 w-px bg-border" />
            <span>{t("footer.bottom.second")}</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
