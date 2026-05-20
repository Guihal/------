import { defineNuxtRouteMiddleware } from "nuxt/app";

export default defineNuxtRouteMiddleware(async () => {
	console.log("MIDDLEWARE RUNNING");
	await new Promise((r) => setTimeout(r, 1000));
	console.log("MIDDLEWARE DONE");
});
