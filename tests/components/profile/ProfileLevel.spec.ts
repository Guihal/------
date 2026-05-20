import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import {
	computeLevel,
	computeProgress,
	XP_PER_LEVEL,
} from "../../../core/domain/progression/compute";

const ProfileLevel = defineComponent({
	props: ["xp", "name"],
	setup(props) {
		const level = computed(() => computeLevel(props.xp));
		const progress = computed(() => computeProgress(props.xp));
		const progressPercent = computed(
			() => (progress.value / XP_PER_LEVEL) * 100,
		);

		return () =>
			h("div", { class: "profile-level", "data-testid": "profile-level" }, [
				h("div", { class: "profile-info" }, [
					h(
						"span",
						{ class: "profile-name", "data-testid": "profile-name" },
						props.name,
					),
					h(
						"span",
						{
							class: "profile-level-badge",
							"data-testid": "profile-level-badge",
						},
						`Lv. ${level.value}`,
					),
				]),
				h("div", { class: "xp-bar" }, [
					h("div", { class: "xp-bar-track" }, [
						h("div", {
							class: "xp-bar-fill",
							"data-testid": "xp-bar-fill",
							style: { width: `${progressPercent.value}%` },
						}),
					]),
					h(
						"span",
						{ class: "xp-text", "data-testid": "xp-text" },
						`${progress.value} / ${XP_PER_LEVEL} XP`,
					),
				]),
			]);
	},
});

describe("ProfileLevel", () => {
	it("renders name", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 0 } });
		expect(wrapper.find('[data-testid="profile-name"]').text()).toBe("Alice");
	});

	it("renders level 0 for 0 xp", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 0 } });
		expect(wrapper.find('[data-testid="profile-level-badge"]').text()).toBe(
			"Lv. 0",
		);
	});

	it("renders level 1 for 1000 xp", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 1000 } });
		expect(wrapper.find('[data-testid="profile-level-badge"]').text()).toBe(
			"Lv. 1",
		);
	});

	it("renders level 2 for 2500 xp", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 2500 } });
		expect(wrapper.find('[data-testid="profile-level-badge"]').text()).toBe(
			"Lv. 2",
		);
	});

	it("renders xp progress text", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 1234 } });
		expect(wrapper.find('[data-testid="xp-text"]').text()).toBe(
			"234 / 1000 XP",
		);
	});

	it("sets progress bar width to 23.4% for 1234 xp", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 1234 } });
		const fill = wrapper.find('[data-testid="xp-bar-fill"]');
		expect(fill.attributes("style")).toContain("width: 23.4");
	});

	it("sets progress bar width to 0% for 0 xp", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 0 } });
		const fill = wrapper.find('[data-testid="xp-bar-fill"]');
		expect(fill.attributes("style")).toContain("width: 0%");
	});

	it("sets progress bar width to 0% for exact level boundary", () => {
		const wrapper = mount(ProfileLevel, { props: { name: "Alice", xp: 2000 } });
		const fill = wrapper.find('[data-testid="xp-bar-fill"]');
		expect(fill.attributes("style")).toContain("width: 0%");
	});
});
