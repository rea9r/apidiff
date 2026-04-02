package openapi

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/rea9r/xdiff/internal/delta"
)

func TestComparePathsMethods(t *testing.T) {
	oldSpec := specWithPaths(map[string][]string{
		"/users":  {"get", "post"},
		"/orders": {"get"},
	})
	newSpec := specWithPaths(map[string][]string{
		"/users":    {"get", "delete"},
		"/products": {"post"},
	})

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.Removed, Path: "paths./orders.get", OldValue: "operation", NewValue: nil},
		{Type: delta.Added, Path: "paths./products.post", OldValue: nil, NewValue: "operation"},
		{Type: delta.Added, Path: "paths./users.delete", OldValue: nil, NewValue: "operation"},
		{Type: delta.Removed, Path: "paths./users.post", OldValue: "operation", NewValue: nil},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_RequestBodyRequiredBecomesBreaking(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"required": false,
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"required": true,
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{
			Type:     delta.Removed,
			Path:     "paths./users.post.requestBody.required",
			OldValue: "optional",
			NewValue: nil,
		},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_ResponseSchemaTypeChanged(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"type": "object",
									},
								},
							},
						},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"type": "array",
									},
								},
							},
						},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{
			Type:     delta.TypeChanged,
			Path:     "paths./users.get.responses.200.content.application/json.schema.type",
			OldValue: "object",
			NewValue: "array",
		},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func specWithPaths(pathMethods map[string][]string) map[string]any {
	paths := map[string]any{}
	for path, methods := range pathMethods {
		pathItem := map[string]any{}
		for _, method := range methods {
			pathItem[method] = map[string]any{}
		}
		paths[path] = pathItem
	}

	return map[string]any{
		"openapi": "3.0.0",
		"paths":   paths,
	}
}

func TestComparePathsMethods_ParameterAddedRemoved(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "page", "in": "query", "required": false, "schema": map[string]any{"type": "integer"}},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "page", "in": "query", "required": false, "schema": map[string]any{"type": "integer"}},
						map[string]any{"name": "limit", "in": "query", "required": false, "schema": map[string]any{"type": "integer"}},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.Added, Path: "paths./users.get.parameters.query.limit", OldValue: nil, NewValue: "query parameter"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_ParameterRequiredChanged(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "page", "in": "query", "required": false, "schema": map[string]any{"type": "integer"}},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "page", "in": "query", "required": true, "schema": map[string]any{"type": "integer"}},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.Removed, Path: "paths./users.get.parameters.query.page", OldValue: "optional", NewValue: "required"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_ParameterTypeChanged(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "id", "in": "path", "required": true, "schema": map[string]any{"type": "integer"}},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"parameters": []any{
						map[string]any{"name": "id", "in": "path", "required": true, "schema": map[string]any{"type": "string"}},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.TypeChanged, Path: "paths./users.get.parameters.path.id", OldValue: "integer", NewValue: "string"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_SchemaPropertyAddedRemoved(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"content": map[string]any{
							"application/json": map[string]any{
								"schema": map[string]any{
									"type": "object",
									"properties": map[string]any{
										"name":  map[string]any{"type": "string"},
										"email": map[string]any{"type": "string"},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"content": map[string]any{
							"application/json": map[string]any{
								"schema": map[string]any{
									"type": "object",
									"properties": map[string]any{
										"name": map[string]any{"type": "string"},
										"age":  map[string]any{"type": "integer"},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.Added, Path: "paths./users.post.requestBody.schema.properties.age", OldValue: nil, NewValue: "integer"},
		{Type: delta.Removed, Path: "paths./users.post.requestBody.schema.properties.email", OldValue: "string", NewValue: nil},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_SchemaRequiredChanged(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"content": map[string]any{
							"application/json": map[string]any{
								"schema": map[string]any{
									"type":     "object",
									"required": []any{"name"},
									"properties": map[string]any{
										"name":  map[string]any{"type": "string"},
										"email": map[string]any{"type": "string"},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"post": map[string]any{
					"requestBody": map[string]any{
						"content": map[string]any{
							"application/json": map[string]any{
								"schema": map[string]any{
									"type":     "object",
									"required": []any{"name", "email"},
									"properties": map[string]any{
										"name":  map[string]any{"type": "string"},
										"email": map[string]any{"type": "string"},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{Type: delta.Removed, Path: "paths./users.post.requestBody.schema.required.email", OldValue: "optional", NewValue: "required"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func TestComparePathsMethods_RefResolution(t *testing.T) {
	oldSpec := map[string]any{
		"components": map[string]any{
			"schemas": map[string]any{
				"User": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"name": map[string]any{"type": "string"},
					},
				},
			},
		},
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"$ref": "#/components/schemas/User",
									},
								},
							},
						},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"components": map[string]any{
			"schemas": map[string]any{
				"User": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"name": map[string]any{"type": "string"},
						"age":  map[string]any{"type": "integer"},
					},
				},
			},
		},
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"$ref": "#/components/schemas/User",
									},
								},
							},
						},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)

	// Both schemas are "object" type, so schema type should NOT change.
	// But the property "age" was added.
	found := false
	for _, d := range got {
		if d.Path == "paths./users.get.responses.200.content.application/json.schema.properties.age" {
			if d.Type != delta.Added {
				t.Fatalf("expected Added for age property, got: %s", d.Type)
			}
			found = true
		}
	}
	if !found {
		t.Fatalf("expected property diff for age, got: %+v", got)
	}
}

func TestComparePathsMethods_ResponseSchemaPropertyChanged(t *testing.T) {
	oldSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"type": "object",
										"properties": map[string]any{
											"name": map[string]any{"type": "string"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	newSpec := map[string]any{
		"paths": map[string]any{
			"/users": map[string]any{
				"get": map[string]any{
					"responses": map[string]any{
						"200": map[string]any{
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"type": "object",
										"properties": map[string]any{
											"name": map[string]any{"type": "integer"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []delta.Diff{
		{
			Type:     delta.TypeChanged,
			Path:     "paths./users.get.responses.200.content.application/json.schema.properties.name",
			OldValue: "string",
			NewValue: "integer",
		},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}
