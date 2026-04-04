import * as FeatureRepository from "../../repositories/master/feature.repository.js";

// ─── Feature Service ──────────────────────────────────────────────────────────

export const getAllFeatures = async (filters) => {
  try {
    return await FeatureRepository.getAllFeatures(filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch features",
      error: err.message,
    };
  }
};

export const getFeatureById = async (id) => {
  try {
    if (!id) throw new Error("Feature ID is required");

    const feature = await FeatureRepository.getFeatureById(id);
    if (!feature) throw new Error("Feature not found");

    return feature;
  } catch (err) {
    throw {
      statusCode: err.statusCode || 404,
      message: err.message,
    };
  }
};

export const createFeature = async (data) => {
  try {
    if (!data.name) throw new Error("Feature name is required");
    if (!data.feature_key) throw new Error("Feature key is required");

    return await FeatureRepository.createFeature(data);
  } catch (err) {
    throw {
      statusCode: 400,
      message: err.message,
    };
  }
};

export const updateFeature = async (id, data) => {
  try {
    if (!id) throw new Error("Feature ID is required");

    const feature = await FeatureRepository.getFeatureById(id);
    if (!feature) throw new Error("Feature not found");

    return await FeatureRepository.updateFeature(id, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const deleteFeature = async (id) => {
  try {
    if (!id) throw new Error("Feature ID is required");

    const feature = await FeatureRepository.getFeatureById(id);
    if (!feature) throw new Error("Feature not found");

    return await FeatureRepository.deleteFeature(id);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

// ─── Bulk helpers ─────────────────────────────────────────────────────────────

const buildBulkResult = (succeeded, failed) => ({
  succeeded,
  failed,
  summary: { total: succeeded.length + failed.length, success: succeeded.length, failed: failed.length },
});

// ─── Bulk Services ────────────────────────────────────────────────────────────

export const bulkCreateFeatures = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await createFeature(item);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkUpdateFeatures = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await updateFeature(id, data);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id, ...data }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkDeleteFeatures = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deleteFeature(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
