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
    const error = ref(null);
    const currentPath = ref("");
    const pathHistory = ref([]);

    const fetchData = async (path = "") => {
        try {
            const response = await api.get(
                `/filemanager/list?path=${encodeURIComponent(path)}`
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
            error.value = err.message;
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

    const biggestFile = ref(null);

    const getBiggestFile = async () => {};

    onMounted(fetchData);
</script>

<template>
    <div class="flex flex-col max-w-6xl w-full mx-auto">
        <h1 class="text-4xl font-bold text-center p-4">File Explorer</h1>

        <div class="relative mb-4 flex items-center w-full">
            <button
                v-if="pathHistory.length"
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
                <span
                    class="text-gray-700 dark:text-gray-300 text-md font-bold"
                >
                    Root: {{ currentPath || "/" }}
                </span>
            </div>

            <div class="ml-auto">
                <button
                    @click="getBiggestFile"
                    type="button"
                    class="text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center cursor-pointer"
                >
                    <MagnifyingGlassIcon class="size-6 text-white mr-1.5" />
                    Find biggest file
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
                        <tr
                            v-if="data.length"
                            v-for="item in data"
                            :key="item.name"
                            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                            :class="{ 'cursor-pointer': item.type === 'dir' }"
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
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
