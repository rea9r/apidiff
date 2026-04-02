package openapi

import (
	"sort"
	"strings"

	"github.com/rea9r/xdiff/internal/delta"
)

type parameterSnapshot struct {
	In       string
	Name     string
	Required bool
	Type     string
}

type schemaSnapshot struct {
	Properties map[string]string // property name -> type
	Required   map[string]bool   // property name -> required
}

type operationSnapshot struct {
	RequestBodyRequired bool
	ResponseSchemaTypes map[string]map[string]string
	Parameters          []parameterSnapshot
	RequestBodySchema   schemaSnapshot
	ResponseSchemas     map[string]map[string]schemaSnapshot // status -> contentType -> schema
}

func ComparePathsMethods(oldSpec, newSpec any) []delta.Diff {
	oldPaths := extractPathMethods(oldSpec)
	newPaths := extractPathMethods(newSpec)

	pathSet := map[string]struct{}{}
	for p := range oldPaths {
		pathSet[p] = struct{}{}
	}
	for p := range newPaths {
		pathSet[p] = struct{}{}
	}

	paths := make([]string, 0, len(pathSet))
	for p := range pathSet {
		paths = append(paths, p)
	}
	sort.Strings(paths)

	var diffs []delta.Diff
	for _, p := range paths {
		oldMethods := oldPaths[p]
		newMethods := newPaths[p]

		methodSet := map[string]struct{}{}
		for m := range oldMethods {
			methodSet[m] = struct{}{}
		}
		for m := range newMethods {
			methodSet[m] = struct{}{}
		}

		methods := make([]string, 0, len(methodSet))
		for m := range methodSet {
			methods = append(methods, m)
		}
		sort.Strings(methods)

		for _, m := range methods {
			ref := operationPath(p, m)
			oldOp, hasOld := oldMethods[m]
			newOp, hasNew := newMethods[m]
			switch {
			case !hasOld && hasNew:
				diffs = append(diffs, delta.Diff{
					Type:     delta.Added,
					Path:     ref.raw(),
					OldValue: nil,
					NewValue: "operation",
				})
			case hasOld && !hasNew:
				diffs = append(diffs, delta.Diff{
					Type:     delta.Removed,
					Path:     ref.raw(),
					OldValue: "operation",
					NewValue: nil,
				})
			default:
				diffs = append(diffs, compareParameters(ref, oldOp, newOp)...)
				diffs = append(diffs, compareRequestBodyRequirement(ref, oldOp, newOp)...)
				diffs = append(diffs, compareRequestBodySchema(ref, oldOp, newOp)...)
				diffs = append(diffs, compareResponseSchemaTypes(ref, oldOp, newOp)...)
				diffs = append(diffs, compareResponseSchemaProperties(ref, oldOp, newOp)...)
			}
		}
	}

	return diffs
}

func extractPathMethods(spec any) map[string]map[string]operationSnapshot {
	root, ok := spec.(map[string]any)
	if !ok {
		return map[string]map[string]operationSnapshot{}
	}

	rawPaths, ok := root["paths"].(map[string]any)
	if !ok {
		return map[string]map[string]operationSnapshot{}
	}

	result := make(map[string]map[string]operationSnapshot, len(rawPaths))
	for path, rawPathItem := range rawPaths {
		pathItem, ok := rawPathItem.(map[string]any)
		if !ok {
			continue
		}
		methods := map[string]operationSnapshot{}
		for key, rawOperation := range pathItem {
			method := strings.ToLower(key)
			if !isSupportedMethod(method) {
				continue
			}

			op, ok := rawOperation.(map[string]any)
			if !ok {
				op = map[string]any{}
			}
			methods[method] = operationSnapshot{
				RequestBodyRequired: extractRequestBodyRequired(root, op),
				ResponseSchemaTypes: extractResponseSchemaTypes(root, op),
				Parameters:          extractParameters(root, op),
				RequestBodySchema:   extractRequestBodySchemaSnapshot(root, op),
				ResponseSchemas:     extractResponseSchemas(root, op),
			}
		}
		if len(methods) > 0 {
			result[path] = methods
		}
	}
	return result
}

// resolveRef follows a $ref to the target object within the spec root.
// It handles simple JSON pointer references like "#/components/schemas/User".
func resolveRef(root map[string]any, obj map[string]any) map[string]any {
	ref, ok := obj["$ref"].(string)
	if !ok {
		return obj
	}
	if !strings.HasPrefix(ref, "#/") {
		return obj // external refs not supported
	}

	parts := strings.Split(strings.TrimPrefix(ref, "#/"), "/")
	var current any = root
	for _, part := range parts {
		m, ok := current.(map[string]any)
		if !ok {
			return obj
		}
		current = m[part]
	}
	resolved, ok := current.(map[string]any)
	if !ok {
		return obj
	}
	return resolved
}

func compareParameters(ref pathRef, oldOp, newOp operationSnapshot) []delta.Diff {
	type paramKey struct{ In, Name string }

	oldParams := make(map[paramKey]parameterSnapshot, len(oldOp.Parameters))
	for _, p := range oldOp.Parameters {
		oldParams[paramKey{p.In, p.Name}] = p
	}
	newParams := make(map[paramKey]parameterSnapshot, len(newOp.Parameters))
	for _, p := range newOp.Parameters {
		newParams[paramKey{p.In, p.Name}] = p
	}

	all := make(map[paramKey]struct{}, len(oldParams)+len(newParams))
	for k := range oldParams {
		all[k] = struct{}{}
	}
	for k := range newParams {
		all[k] = struct{}{}
	}

	keys := make([]paramKey, 0, len(all))
	for k := range all {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].In != keys[j].In {
			return keys[i].In < keys[j].In
		}
		return keys[i].Name < keys[j].Name
	})

	var diffs []delta.Diff
	for _, k := range keys {
		path := parameterPath(ref.apiPath, ref.method, k.In, k.Name).raw()
		oldP, hasOld := oldParams[k]
		newP, hasNew := newParams[k]
		switch {
		case !hasOld && hasNew:
			if newP.Required {
				diffs = append(diffs, delta.Diff{
					Type:     delta.Removed,
					Path:     path,
					OldValue: nil,
					NewValue: "required " + k.In + " parameter",
				})
			} else {
				diffs = append(diffs, delta.Diff{
					Type:     delta.Added,
					Path:     path,
					OldValue: nil,
					NewValue: k.In + " parameter",
				})
			}
		case hasOld && !hasNew:
			diffs = append(diffs, delta.Diff{
				Type:     delta.Removed,
				Path:     path,
				OldValue: k.In + " parameter",
				NewValue: nil,
			})
		default:
			if oldP.Required != newP.Required {
				if newP.Required {
					diffs = append(diffs, delta.Diff{
						Type:     delta.Removed,
						Path:     path,
						OldValue: "optional",
						NewValue: "required",
					})
				} else {
					diffs = append(diffs, delta.Diff{
						Type:     delta.Added,
						Path:     path,
						OldValue: "required",
						NewValue: "optional",
					})
				}
			}
			if oldP.Type != newP.Type && oldP.Type != "" && newP.Type != "" {
				diffs = append(diffs, delta.Diff{
					Type:     delta.TypeChanged,
					Path:     path,
					OldValue: oldP.Type,
					NewValue: newP.Type,
				})
			}
		}
	}
	return diffs
}

func compareRequestBodySchema(ref pathRef, oldOp, newOp operationSnapshot) []delta.Diff {
	return compareSchemaSnapshots(ref, "requestBody", oldOp.RequestBodySchema, newOp.RequestBodySchema)
}

func compareResponseSchemaProperties(ref pathRef, oldOp, newOp operationSnapshot) []delta.Diff {
	statusSet := map[string]struct{}{}
	for s := range oldOp.ResponseSchemas {
		statusSet[s] = struct{}{}
	}
	for s := range newOp.ResponseSchemas {
		statusSet[s] = struct{}{}
	}

	statuses := make([]string, 0, len(statusSet))
	for s := range statusSet {
		statuses = append(statuses, s)
	}
	sort.Strings(statuses)

	var diffs []delta.Diff
	for _, status := range statuses {
		oldContent := oldOp.ResponseSchemas[status]
		newContent := newOp.ResponseSchemas[status]

		ctSet := map[string]struct{}{}
		for ct := range oldContent {
			ctSet[ct] = struct{}{}
		}
		for ct := range newContent {
			ctSet[ct] = struct{}{}
		}

		contentTypes := make([]string, 0, len(ctSet))
		for ct := range ctSet {
			contentTypes = append(contentTypes, ct)
		}
		sort.Strings(contentTypes)

		for _, ct := range contentTypes {
			section := "responses." + status + ".content." + ct
			oldSchema := oldContent[ct]
			newSchema := newContent[ct]
			diffs = append(diffs, compareSchemaSnapshots(ref, section, oldSchema, newSchema)...)
		}
	}
	return diffs
}

func compareSchemaSnapshots(ref pathRef, section string, oldSchema, newSchema schemaSnapshot) []delta.Diff {
	propSet := map[string]struct{}{}
	for p := range oldSchema.Properties {
		propSet[p] = struct{}{}
	}
	for p := range newSchema.Properties {
		propSet[p] = struct{}{}
	}

	props := make([]string, 0, len(propSet))
	for p := range propSet {
		props = append(props, p)
	}
	sort.Strings(props)

	var diffs []delta.Diff
	for _, prop := range props {
		oldType, hasOld := oldSchema.Properties[prop]
		newType, hasNew := newSchema.Properties[prop]
		propPath := schemaPropertyPath(ref.apiPath, ref.method, section, prop).raw()
		switch {
		case !hasOld && hasNew:
			diffs = append(diffs, delta.Diff{
				Type:     delta.Added,
				Path:     propPath,
				OldValue: nil,
				NewValue: newType,
			})
		case hasOld && !hasNew:
			diffs = append(diffs, delta.Diff{
				Type:     delta.Removed,
				Path:     propPath,
				OldValue: oldType,
				NewValue: nil,
			})
		case hasOld && hasNew && oldType != newType:
			diffs = append(diffs, delta.Diff{
				Type:     delta.TypeChanged,
				Path:     propPath,
				OldValue: oldType,
				NewValue: newType,
			})
		}
	}

	// Compare required fields
	reqSet := map[string]struct{}{}
	for p := range oldSchema.Required {
		reqSet[p] = struct{}{}
	}
	for p := range newSchema.Required {
		reqSet[p] = struct{}{}
	}

	reqProps := make([]string, 0, len(reqSet))
	for p := range reqSet {
		reqProps = append(reqProps, p)
	}
	sort.Strings(reqProps)

	for _, prop := range reqProps {
		oldReq := oldSchema.Required[prop]
		newReq := newSchema.Required[prop]
		if oldReq == newReq {
			continue
		}
		reqPath := schemaRequiredPath(ref.apiPath, ref.method, section, prop).raw()
		if newReq {
			diffs = append(diffs, delta.Diff{
				Type:     delta.Removed,
				Path:     reqPath,
				OldValue: "optional",
				NewValue: "required",
			})
		} else {
			diffs = append(diffs, delta.Diff{
				Type:     delta.Added,
				Path:     reqPath,
				OldValue: "required",
				NewValue: "optional",
			})
		}
	}

	return diffs
}

func compareRequestBodyRequirement(ref pathRef, oldOp, newOp operationSnapshot) []delta.Diff {
	oldRequired := oldOp.RequestBodyRequired
	newRequired := newOp.RequestBodyRequired
	if oldRequired == newRequired {
		return nil
	}

	path := requestBodyRequiredPath(ref.apiPath, ref.method).raw()
	if !oldRequired && newRequired {
		// Optional request body support disappeared: treat as breaking.
		return []delta.Diff{{
			Type:     delta.Removed,
			Path:     path,
			OldValue: "optional",
			NewValue: nil,
		}}
	}

	// Request body became optional: non-breaking.
	return []delta.Diff{{
		Type:     delta.Added,
		Path:     path,
		OldValue: nil,
		NewValue: "optional",
	}}
}

func compareResponseSchemaTypes(ref pathRef, oldOp, newOp operationSnapshot) []delta.Diff {
	var diffs []delta.Diff

	statusSet := map[string]struct{}{}
	for status := range oldOp.ResponseSchemaTypes {
		statusSet[status] = struct{}{}
	}
	for status := range newOp.ResponseSchemaTypes {
		statusSet[status] = struct{}{}
	}

	statuses := make([]string, 0, len(statusSet))
	for status := range statusSet {
		statuses = append(statuses, status)
	}
	sort.Strings(statuses)

	for _, status := range statuses {
		oldContent := oldOp.ResponseSchemaTypes[status]
		newContent := newOp.ResponseSchemaTypes[status]

		contentSet := map[string]struct{}{}
		for contentType := range oldContent {
			contentSet[contentType] = struct{}{}
		}
		for contentType := range newContent {
			contentSet[contentType] = struct{}{}
		}

		contentTypes := make([]string, 0, len(contentSet))
		for contentType := range contentSet {
			contentTypes = append(contentTypes, contentType)
		}
		sort.Strings(contentTypes)

		for _, contentType := range contentTypes {
			oldType, hasOld := oldContent[contentType]
			newType, hasNew := newContent[contentType]
			path := responseSchemaTypePath(ref.apiPath, ref.method, status, contentType).raw()
			switch {
			case !hasOld && hasNew:
				diffs = append(diffs, delta.Diff{
					Type:     delta.Added,
					Path:     path,
					OldValue: nil,
					NewValue: newType,
				})
			case hasOld && !hasNew:
				diffs = append(diffs, delta.Diff{
					Type:     delta.Removed,
					Path:     path,
					OldValue: oldType,
					NewValue: nil,
				})
			case hasOld && hasNew && oldType != newType:
				diffs = append(diffs, delta.Diff{
					Type:     delta.TypeChanged,
					Path:     path,
					OldValue: oldType,
					NewValue: newType,
				})
			}
		}
	}

	return diffs
}

func extractRequestBodyRequired(root map[string]any, op map[string]any) bool {
	rawRequestBody, ok := op["requestBody"].(map[string]any)
	if !ok {
		return false
	}
	rawRequestBody = resolveRef(root, rawRequestBody)

	required, ok := rawRequestBody["required"].(bool)
	return ok && required
}

func extractResponseSchemaTypes(root map[string]any, op map[string]any) map[string]map[string]string {
	rawResponses, ok := op["responses"].(map[string]any)
	if !ok {
		return map[string]map[string]string{}
	}

	result := map[string]map[string]string{}
	for statusCode, rawResponse := range rawResponses {
		response, ok := rawResponse.(map[string]any)
		if !ok {
			continue
		}
		response = resolveRef(root, response)

		rawContent, ok := response["content"].(map[string]any)
		if !ok {
			continue
		}

		for contentType, rawMediaType := range rawContent {
			mediaType, ok := rawMediaType.(map[string]any)
			if !ok {
				continue
			}

			schema, ok := mediaType["schema"].(map[string]any)
			if !ok {
				continue
			}
			schema = resolveRef(root, schema)

			typ, ok := schema["type"].(string)
			if !ok || typ == "" {
				continue
			}

			if _, exists := result[statusCode]; !exists {
				result[statusCode] = map[string]string{}
			}
			result[statusCode][contentType] = typ
		}
	}

	return result
}

func extractParameters(root map[string]any, op map[string]any) []parameterSnapshot {
	rawParams, ok := op["parameters"].([]any)
	if !ok {
		return nil
	}

	var params []parameterSnapshot
	for _, rawParam := range rawParams {
		param, ok := rawParam.(map[string]any)
		if !ok {
			continue
		}
		param = resolveRef(root, param)

		name, _ := param["name"].(string)
		in, _ := param["in"].(string)
		if name == "" || in == "" {
			continue
		}
		required, _ := param["required"].(bool)
		var typ string
		if schema, ok := param["schema"].(map[string]any); ok {
			schema = resolveRef(root, schema)
			typ, _ = schema["type"].(string)
		}
		params = append(params, parameterSnapshot{
			In:       in,
			Name:     name,
			Required: required,
			Type:     typ,
		})
	}
	return params
}

func extractSchemaSnapshot(root map[string]any, schema map[string]any) schemaSnapshot {
	schema = resolveRef(root, schema)

	snap := schemaSnapshot{
		Properties: map[string]string{},
		Required:   map[string]bool{},
	}

	rawProps, ok := schema["properties"].(map[string]any)
	if ok {
		for name, rawProp := range rawProps {
			prop, ok := rawProp.(map[string]any)
			if !ok {
				continue
			}
			prop = resolveRef(root, prop)
			typ, _ := prop["type"].(string)
			if typ == "" {
				typ = "unknown"
			}
			snap.Properties[name] = typ
		}
	}

	rawRequired, ok := schema["required"].([]any)
	if ok {
		for _, r := range rawRequired {
			name, ok := r.(string)
			if ok {
				snap.Required[name] = true
			}
		}
	}

	return snap
}

func extractRequestBodySchemaSnapshot(root map[string]any, op map[string]any) schemaSnapshot {
	rawRequestBody, ok := op["requestBody"].(map[string]any)
	if !ok {
		return schemaSnapshot{Properties: map[string]string{}, Required: map[string]bool{}}
	}
	rawRequestBody = resolveRef(root, rawRequestBody)

	rawContent, ok := rawRequestBody["content"].(map[string]any)
	if !ok {
		return schemaSnapshot{Properties: map[string]string{}, Required: map[string]bool{}}
	}

	// Use the first content type's schema (typically application/json)
	for _, rawMediaType := range rawContent {
		mediaType, ok := rawMediaType.(map[string]any)
		if !ok {
			continue
		}
		schema, ok := mediaType["schema"].(map[string]any)
		if !ok {
			continue
		}
		return extractSchemaSnapshot(root, schema)
	}
	return schemaSnapshot{Properties: map[string]string{}, Required: map[string]bool{}}
}

func extractResponseSchemas(root map[string]any, op map[string]any) map[string]map[string]schemaSnapshot {
	rawResponses, ok := op["responses"].(map[string]any)
	if !ok {
		return map[string]map[string]schemaSnapshot{}
	}

	result := map[string]map[string]schemaSnapshot{}
	for statusCode, rawResponse := range rawResponses {
		response, ok := rawResponse.(map[string]any)
		if !ok {
			continue
		}
		response = resolveRef(root, response)

		rawContent, ok := response["content"].(map[string]any)
		if !ok {
			continue
		}

		for contentType, rawMediaType := range rawContent {
			mediaType, ok := rawMediaType.(map[string]any)
			if !ok {
				continue
			}
			schema, ok := mediaType["schema"].(map[string]any)
			if !ok {
				continue
			}
			if _, exists := result[statusCode]; !exists {
				result[statusCode] = map[string]schemaSnapshot{}
			}
			result[statusCode][contentType] = extractSchemaSnapshot(root, schema)
		}
	}
	return result
}
