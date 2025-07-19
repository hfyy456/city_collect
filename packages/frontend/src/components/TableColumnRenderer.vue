<template>
  <el-table-column :label="column.label" :min-width="column.width">
    <!-- Render nested columns if it's a group -->
    <template v-if="isGroup">
      <TableColumnRenderer v-for="child in column.children" :key="child.label || child.prop" :column="child">
        <template #default="scope">
          <slot :scope="scope" :column="child"></slot>
        </template>
      </TableColumnRenderer>
    </template>

    <!-- Render cell content if it's a final column -->
    <template #default="scope" v-if="!isGroup">
      <slot :scope="scope" :column="column"></slot>
    </template>
  </el-table-column>
</template>

<script lang="ts">
// Using options API here to provide a name for recursive component calls.
export default {
  name: 'TableColumnRenderer'
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  column: {
    type: Object,
    required: true
  }
});

const isGroup = computed(() => props.column.children && props.column.children.length > 0);
</script> 