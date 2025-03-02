<script setup>
    import { ref, onMounted } from "vue";
    import api from "@/services/api";
    import {
        DocumentTextIcon,
        FolderIcon,
        ArrowLongLeftIcon,
        MagnifyingGlassIcon,
    } from "@heroicons/vue/24/solid";

    const data = ref([]);
    const currentPath = ref("");
    const pathHistory = ref([]);
    const isLoading = ref(false);
    const apiUrl = "/filemanager/list?path=";

    const fetchData = async (path = "") => {
        largestFile.value = null;
        isLoading.value = true;
        try {
            const response = await api.get(
                `${apiUrl}${encodeURIComponent(path)}`
            );

            const dirs = response.data.files.filter(
                (item) => item.type === "dir"
            );
            const files = response.data.files.filter(
                (item) => item.type === "file"
            );

            data.value = [...dirs, ...files];

            currentPath.value = path;
        } catch (err) {
            console.log("Error occurred");
        } finally {
            isLoading.value = false;
        }
    };

    const openDirectory = async (item) => {
        if (item.type !== "dir") return;

        pathHistory.value.push(currentPath.value);

        const newPath = currentPath.value
            ? `${currentPath.value}/${item.name}`
            : item.name;

        await fetchData(newPath);
    };

    const goBack = async () => {
        if (pathHistory.value.length > 0) {
            const previousPath = pathHistory.value.pop();
            await fetchData(previousPath);
        }
    };

    const largestFile = ref(null);

    const fetchWithRetry = async (url, retries = 3, delay = 3000) => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                const response = await api.get(url);
                return response.data;
            } catch (error) {
                attempt++;

                if (attempt >= retries) {
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    };
    const getLargestFile = async () => {
        isLoading.value = true;
        largestFile.value = null;
        pathHistory.value = [];
        currentPath.value = "";
        const queue = [""];
        let largest = { name: "", sizeBytes: 0 };

        while (queue.length) {
            const currentDir = queue.shift();
            try {
                const data = await fetchWithRetry(
                    `${apiUrl}${encodeURIComponent(currentDir)}`
                );

                if (!data || !data.files) {
                    continue;
                }

                data.files.forEach((file) => {
                    if (
                        file.type === "file" &&
                        file.sizeBytes > largest.sizeBytes
                    ) {
                        largest = file;
                    }
                    if (file.type === "dir") {
                        queue.push(
                            currentDir
                                ? `${currentDir}/${file.name}`
                                : file.name
                        );
                    }
                });
            } catch (error) {
                console.log("Error occurred");
            }
        }

        largestFile.value = largest;
        isLoading.value = false;
    };

    onMounted(fetchData);
</script>

<template>
    <div class="flex flex-col max-w-6xl w-full mx-auto">
        <h1 class="text-4xl font-bold text-center p-4">File Explorer</h1>

        <div class="relative mb-4 flex items-center w-full">
            <button
                v-if="pathHistory.length && currentPath !== ''"
                @click="goBack"
                type="button"
                class="text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center cursor-pointer"
            >
                <ArrowLongLeftIcon class="size-6 text-white mr-1.5" />
                Go back
            </button>

            <div
                class="absolute left-1/2 transform -translate-x-1/2 text-center flex items-center"
            >
                <button
                    @click="fetchData('')"
                    :disabled="isLoading"
                    class="text-gray-700 dark:text-gray-300 text-md font-bold hover:underline focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400"
                >
                    root/
                </button>
                <span
                    class="text-gray-700 dark:text-gray-300 text-md font-bold"
                >
                    {{
                        currentPath && currentPath !== ""
                            ? currentPath.split("/").join("/")
                            : ""
                    }}
                </span>
            </div>

            <div class="ml-auto">
                <button
                    @click="getLargestFile"
                    type="button"
                    class="text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400"
                    :disabled="isLoading"
                >
                    <MagnifyingGlassIcon class="size-6 text-white mr-1.5" />
                    Largest file
                </button>
            </div>
        </div>

        <div class="flex items-center flex-col">
            <div
                class="w-full rounded relative overflow-x-auto shadow-md sm:rounded-lg"
            >
                <table
                    class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
                >
                    <thead
                        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
                    >
                        <tr>
                            <th scope="col" class="px-6 py-3">Type</th>
                            <th scope="col" class="px-6 py-3">Name</th>
                            <th scope="col" class="px-6 py-3">Size (Bytes)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="isLoading">
                            <td
                                colspan="3"
                                class="p-4 text-center font-bold uppercase dark:text-gray-400"
                            >
                                <div
                                    class="flex justify-center items-center gap-2 relative"
                                >
                                    <span class="relative z-10">
                                        Fetching data
                                    </span>
                                    <div
                                        class="loader w-3 h-3 -ml-2 relative top-[2px]"
                                    ></div>
                                </div>
                            </td>
                        </tr>

                        <tr
                            v-else-if="largestFile"
                            class="bg-white dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            <td class="px-6 py-4">
                                <DocumentTextIcon class="text-white size-6" />
                            </td>
                            <td class="px-6 py-4">{{ largestFile.name }}</td>
                            <td class="px-6 py-4">
                                {{ largestFile.sizeBytes }}
                            </td>
                        </tr>

                        <template v-else>
                            <tr
                                v-if="data.length"
                                v-for="item in data"
                                :key="item.name"
                                class="bg-white dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                :class="{
                                    'cursor-pointer': item.type === 'dir',
                                }"
                                @click="openDirectory(item)"
                            >
                                <td
                                    class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                    <component
                                        :is="
                                            item.type === 'dir'
                                                ? FolderIcon
                                                : DocumentTextIcon
                                        "
                                        class="text-white size-6"
                                    />
                                </td>
                                <td class="px-6 py-4">{{ item.name }}</td>
                                <td class="px-6 py-4">{{ item.sizeBytes }}</td>
                            </tr>
                            <tr
                                v-else
                                class="bg-white dark:bg-gray-800 dark:border-gray-700 border-gray-200"
                            >
                                <td colspan="3">
                                    <div class="p-4 uppercase">
                                        This folder is empty
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
