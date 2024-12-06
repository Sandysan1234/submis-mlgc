const predictClassification = require("../services/inferenceService");
const crypto = require("crypto");
const { storeData, getData } = require("../services/firestoreServices");

async function postPredictHandler(request, h) {
    try {
        const { image } = request.payload;
        const { model } = request.server.app;

        if (!image) {
            const response = h.response({
                status: "fail",
                message: "Gambar tidak ditemukan dalam payload",
            });
            response.code(400);
            return response;
        }

        const { confidenceScore, label, suggestion } = await predictClassification(model, image);

        if (!label || confidenceScore === undefined) {
            const response = h.response({
                status: "fail",
                message: "Terjadi kesalahan dalam melakukan prediksi",
            });
            response.code(400);
            return response;
        }

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const data = {
            id: id,
            result: label,
            suggestion: suggestion,
            confidenceScore: confidenceScore,
            createdAt: createdAt,
        };

        await storeData(id, data);

        const response = h.response({
            status: "success",
            message: confidenceScore > 0 ? "Model is predicted successfully" : "Please use the correct picture",
            data,
        });
        response.code(201);
        return response;
    } catch (error) {

        const response = h.response({
            status: "fail",
            message: "Terjadi kesalahan dalam melakukan prediksi",
        });
        response.code(400);
        return response;
    }
}


async function getPredictHandler(request, h) {
	const { id } = request.params;

	const data = await getData(id);

	if (!data) {
		const response = h.response({
			status: "fail",
			message: "Prediction not found",
		});
		response.code(404);
		return response;
	}

	const response = h.response({
		status: "success",
		data,
	});
	response.code(200);
	return response;
}

module.exports = { postPredictHandler, getPredictHandler };