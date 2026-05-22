from rest_framework import serializers

from notes.models import Note


class NoteSerializer(serializers.ModelSerializer):
    workspaceId = serializers.UUIDField(source="workspace_id", read_only=True)
    authorId = serializers.CharField(source="author_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Note
        fields = ["id", "workspaceId", "title", "content", "authorId", "createdAt", "updatedAt"]
        read_only_fields = fields


class NoteCreatePayload(serializers.Serializer):
    title = serializers.CharField(min_length=1, max_length=200, trim_whitespace=True)
    content = serializers.CharField(min_length=1, max_length=10000, trim_whitespace=False)


class NoteUpdatePayload(serializers.Serializer):
    title = serializers.CharField(
        min_length=1, max_length=200, required=False, trim_whitespace=True
    )
    content = serializers.CharField(
        min_length=1, max_length=10000, required=False, trim_whitespace=False
    )

    def validate(self, attrs):
        if "title" not in attrs and "content" not in attrs:
            raise serializers.ValidationError(
                "At least one of title or content must be provided."
            )
        return attrs
