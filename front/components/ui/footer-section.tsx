'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { FrameIcon } from 'lucide-react';

import { cn } from '@/lib/format';

export interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

export interface FooterSectionData {
	label: string;
	links: FooterLink[];
}

interface FooterProps {
	brand?: string;
	logo?: ReactNode;
	sections?: FooterSectionData[];
	className?: string;
}

const defaultSections: FooterSectionData[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '#features' },
			{ title: 'Pricing', href: '#pricing' },
		],
	},
];

export function Footer({ brand = 'Asme', logo, sections = defaultSections, className }: FooterProps) {
	return (
		<footer
			className={cn(
				'md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16',
				className,
			)}
			data-testid="footer"
		>
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<div className="flex items-center gap-2 font-display text-xl font-extrabold">
						{logo ?? <FrameIcon className="size-8" />}
						{brand}
					</div>
					<p className="text-muted-foreground mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} {brand}. Todos los derechos reservados.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0">
					{sections.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold">{section.label}</h3>
								<ul className="text-muted-foreground mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<FooterAnchor link={link} />
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

// Rutas internas usan react-router (sin recargar la página); '#' y externas usan <a>
function FooterAnchor({ link }: { link: FooterLink }) {
	const cls = 'hover:text-foreground inline-flex items-center transition-all duration-300';
	const content = (
		<>
			{link.icon && <link.icon className="me-1 size-4" />}
			{link.title}
		</>
	);
	return link.href.startsWith('/') ? (
		<Link to={link.href} className={cls}>{content}</Link>
	) : (
		<a href={link.href} className={cls}>{content}</a>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
