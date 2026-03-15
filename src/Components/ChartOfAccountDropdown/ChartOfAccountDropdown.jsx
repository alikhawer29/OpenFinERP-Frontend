import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getChartOfAccountListing } from '../../Services/Masters/ChartOfAccount';
import './chartOfAccountDropdown.css';
import CustomCheckbox from '../CustomCheckbox/CustomCheckbox';
import { showErrorToast } from '../../Utils/Utils';

const toCodeString = (value) =>
  value === null || value === undefined ? '' : value.toString().trim();

const setsAreEqual = (arr1 = [], arr2 = []) => {
  const a = new Set((arr1 || []).map(toCodeString));
  const b = new Set((arr2 || []).map(toCodeString));
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
};

const collectGrantedCodes = (input) => {
  if (!input) return [];

  const codes = new Set();

  const traverse = (node) => {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      codes.add(toCodeString(node));
      return;
    }

    if (typeof node === 'object') {
      if ('account_code' in node) {
        const granted =
          'granted' in node
            ? node.granted
            : 'value' in node
            ? node.value
            : node.selected;

        if (granted) {
          codes.add(toCodeString(node.account_code));
        }

        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (value) {
          codes.add(toCodeString(key));
        } else if (value && typeof value === 'object') {
          traverse(value);
        }
      });
    }
  };

  traverse(input);
  return Array.from(codes);
};

const MenuItem = ({
  item,
  level,
  expandedItems,
  toggleItem,
  selectedItems,
  onItemSelect,
  parentPath = '',
}) => {
  const itemCode = toCodeString(item.account_code);
  const itemKey = parentPath ? `${parentPath}_${itemCode}` : itemCode;
  const hasChildren = item?.children && item?.children.length > 0;
  const isSelected = selectedItems.includes(itemCode);

  return (
    <div className="coa-menu-item detail-text">
      <div
        className={`coa-menu-item-content ${level === 1 ? 'level-1-account' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          // only toggle expand when clicking the label if it has children
          if (hasChildren) toggleItem(itemKey);
        }}
        style={{ paddingLeft: `${level * 1}rem` }}
      >
        <div className="d-flex gap-2 align-items-center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            {`${item.account_code} - ${item.account_name}`}
          </div>

          {level > 1 && (
            <CustomCheckbox
              style={{ border: 'none', marginBottom: 0 }}
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onItemSelect(itemCode);
              }}
              key={`${itemKey}-${item.account_name}`}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div className="coa-menu-item-children">
          {item.children.map((child, childIndex) => {
            const childCode = toCodeString(child.account_code);
            const childPath = `${itemKey}_${childIndex}`;
            const childKey = `${childPath}_${childCode}`;
            return (
              <MenuItem
                key={childKey}
                item={child}
                level={level + 1}
                expandedItems={expandedItems}
                toggleItem={toggleItem}
                selectedItems={selectedItems}
                onItemSelect={onItemSelect}
                parentPath={childPath}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChartOfAccountDropdown = ({
  userAccountPermissions = null,
  otherUserAccountPermissions,
  onSelectionChange,
  onSelectableCodesChange,
  allowFullAccess = false,
  allowFullAccessSections = [],
  selectedAccountCodes = [],
}) => {
  const [data, setData] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const notifyPendingRef = useRef(false);
  const pendingSelectionRef = useRef([]);

  // fetch chart of accounts once
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const response = await getChartOfAccountListing();
        if (mounted) setData(response || []);
      } catch (error) {
        console.error('Error fetching chart of accounts:', error);
        showErrorToast(error);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const { descendantsMap, ancestorsMap, directChildrenMap } = useMemo(() => {
    const descendants = {};
    const ancestors = {};
    const directChildren = {};

    const dfs = (node, parentChain = []) => {
      if (!node || !node.account_code) {
        return [];
      }

      const selfCode = toCodeString(node.account_code);
      ancestors[selfCode] = parentChain.map(toCodeString);

      if (node.children && node.children.length) {
        directChildren[selfCode] = node.children
          .map((child) => toCodeString(child.account_code))
          .filter(Boolean);
      } else {
        directChildren[selfCode] = [];
      }

      let aggregate = [selfCode];

      if (node.children && node.children.length) {
        node.children.forEach((child) => {
          const childCodes = dfs(child, [...parentChain, selfCode]);
          aggregate = aggregate.concat(childCodes);
        });
      }

      descendants[selfCode] = Array.from(new Set(aggregate.map(toCodeString)));
      return descendants[selfCode];
    };

    (data || []).forEach((node) => dfs(node));
    return {
      descendantsMap: descendants,
      ancestorsMap: ancestors,
      directChildrenMap: directChildren,
    };
  }, [data]);

  const selectableCodes = useMemo(() => {
    const codes = new Set();
    const traverse = (nodes = [], level = 1) => {
      nodes.forEach((node) => {
        if (!node || !node.account_code) return;
        if (level > 1) {
          codes.add(toCodeString(node.account_code));
        }
        if (node.children && node.children.length) {
          traverse(node.children, level + 1);
        }
      });
    };
    traverse(data, 1);
    return Array.from(codes);
  }, [data]);

  useEffect(() => {
    if (typeof onSelectableCodesChange === 'function') {
      onSelectableCodesChange(selectableCodes);
    }
  }, [selectableCodes, onSelectableCodesChange]);

  const applyParentSelectionRules = (items = []) => {
    const resultSet = new Set(items.map(toCodeString));

    Object.entries(directChildrenMap || {}).forEach(([parentCode, children]) => {
      if (!children || children.length === 0) {
        return;
      }

      const normalizedParent = toCodeString(parentCode);
      const hasAnyChildSelected = children.some((childCode) =>
        resultSet.has(toCodeString(childCode))
      );

      if (hasAnyChildSelected) {
        resultSet.add(normalizedParent);
      } else {
        resultSet.delete(normalizedParent);
      }
    });

    return Array.from(resultSet);
  };

  // helper that collects all account_codes under a node (including itself)
  const collectCodesRecursively = (nodes = []) => {
    const codes = [];
    nodes.forEach((node) => {
      if (!node) return;
      if (node.account_code) codes.push(toCodeString(node.account_code));
      if (node.children && node.children.length) {
        codes.push(...collectCodesRecursively(node.children));
      }
    });
    return codes;
  };

  // compute target section codes (for Allow Full Access)
  const targetSectionAccountCodes = useMemo(() => {
    if (!data?.length || !allowFullAccessSections?.length) return [];

    const normalizedTargetSections = allowFullAccessSections
      .map((s) => (s || '').toString().trim().toLowerCase())
      .filter(Boolean);

    const matchedCodes = new Set();

    const matchSection = (value = '') => {
      const v = value.toString().trim().toLowerCase();
      return normalizedTargetSections.some(
        (section) =>
          v === section || v.includes(section) || section.includes(v)
      );
    };

    const traverse = (nodes = []) => {
      nodes.forEach((node) => {
        if (!node) return;
        const nameMatches = matchSection(node.account_name || '');
        const codeMatches = matchSection(node.account_code || '');
        if (nameMatches || codeMatches) {
          collectCodesRecursively([node]).forEach((c) => matchedCodes.add(c));
        } else if (node.children && node.children.length) {
          traverse(node.children);
        }
      });
    };

    traverse(data);
    return Array.from(matchedCodes);
  }, [data, allowFullAccessSections]);

  // Internal helper to update selectedItems without causing unnecessary notifications or loops.
  // notify option controls whether we call the parent's onSelectionChange
  const updateSelectedItems = (updater, { notify = false } = {}) => {
    setSelectedItems((prev) => {
      const candidate =
        typeof updater === 'function' ? updater(prev) : updater || [];
      const normalizedNext = Array.isArray(candidate)
        ? Array.from(new Set(candidate.map(toCodeString)))
        : [];
      const finalNext = applyParentSelectionRules(normalizedNext);
      if (setsAreEqual(prev, finalNext)) {
        // no change, do nothing
        return prev;
      }
      if (notify) {
        notifyPendingRef.current = true;
        pendingSelectionRef.current = finalNext;
      }
      return finalNext;
    });
  };

  useEffect(() => {
    if (!notifyPendingRef.current) {
      return;
    }
    notifyPendingRef.current = false;
    if (typeof onSelectionChange === 'function') {
      try {
        onSelectionChange(pendingSelectionRef.current || selectedItems);
      } catch (err) {
        console.error('onSelectionChange threw', err);
      }
    }
  }, [selectedItems, onSelectionChange]);

  // When parent provides selectedAccountCodes (explicit override), sync them in (no notify)
  useEffect(() => {
    if (!selectedAccountCodes) return;
    const sanitized = Array.from(
      new Set(
        (Array.isArray(selectedAccountCodes)
          ? selectedAccountCodes
          : [selectedAccountCodes]
        )
          .filter(Boolean)
          .map(toCodeString)
      )
    );
    // Only update if different to avoid loops
    updateSelectedItems(sanitized, { notify: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountCodes && selectedAccountCodes.length ? JSON.stringify(selectedAccountCodes.slice().sort()) : selectedAccountCodes]);

  // If otherUserAccountPermissions provided and parent hasn't explicitly provided selectedAccountCodes,
  // initialize selection from those permissions (no notify)
  useEffect(() => {
    if (!otherUserAccountPermissions) return;
    if (selectedAccountCodes && selectedAccountCodes.length) return;
    const granted = collectGrantedCodes(otherUserAccountPermissions);
    updateSelectedItems(granted, { notify: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserAccountPermissions]);

  // If userAccountPermissions provided and parent hasn't explicitly provided selectedAccountCodes,
  // initialize selection from those permissions (no notify)
  useEffect(() => {
    if (!userAccountPermissions) return;
    if (selectedAccountCodes && selectedAccountCodes.length) return;
    const granted = collectGrantedCodes(userAccountPermissions);
    updateSelectedItems(granted, { notify: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccountPermissions]);

  // Handle allowFullAccess toggling:
  // - when allowFullAccess becomes true, add targetSectionAccountCodes to selection and notify parent
  // - when it becomes false (and previously was true), remove those codes and notify parent
  const prevAllowRef = useRef(allowFullAccess);
  useEffect(() => {
    const prev = prevAllowRef.current;
    prevAllowRef.current = allowFullAccess;

    if (!targetSectionAccountCodes.length) return;

    if (allowFullAccess && !prev) {
      updateSelectedItems(
        (prevArr) => Array.from(new Set([...(prevArr || []), ...targetSectionAccountCodes.map(toCodeString)])),
        { notify: true }
      );
    } else if (!allowFullAccess && prev) {
      const toRemove = new Set(targetSectionAccountCodes.map(toCodeString));
      updateSelectedItems(
        (prevArr) => (prevArr || []).filter((c) => !toRemove.has(toCodeString(c))),
        { notify: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowFullAccess, JSON.stringify(targetSectionAccountCodes.slice().sort())]);

  // toggle expand/collapse (tracks unique key strings)
  const toggleItem = (uniqueKey) => {
    setExpandedItems((prev) =>
      prev.includes(uniqueKey) ? prev.filter((i) => i !== uniqueKey) : [...prev, uniqueKey]
    );
  };

  const handleItemSelect = (account_code) => {
    const code = toCodeString(account_code);
    const descendantCodes = descendantsMap[code] || [code];
    const descendantSet = new Set(descendantCodes.map(toCodeString));
    const directParent = ancestorsMap[code]?.slice(-1)[0]
      ? toCodeString(ancestorsMap[code].slice(-1)[0])
      : null;

    updateSelectedItems(
      (prev) => {
        const prevSet = new Set((prev || []).map(toCodeString));
        const hasCode = prevSet.has(code);

        if (hasCode) {
          descendantSet.forEach((desc) => prevSet.delete(desc));
          if (directParent) {
            prevSet.delete(directParent);
          }
          return applyParentSelectionRules(Array.from(prevSet));
        }

        descendantSet.forEach((desc) => prevSet.add(desc));
        if (directParent) {
          prevSet.add(directParent);
        }
        return applyParentSelectionRules(Array.from(prevSet));
      },
      { notify: true }
    );
  };

  return (
    <div className="coa-dropdown-container">
      {data.map((item, index) => {
        const rootPath = `root_${index}`;
        return (
          <MenuItem
            key={`${rootPath}_${toCodeString(item.account_code)}`}
            parentPath={rootPath}
            item={item}
            level={1}
            expandedItems={expandedItems}
            toggleItem={toggleItem}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
          />
        );
      })}
    </div>
  );
};

export default ChartOfAccountDropdown;
